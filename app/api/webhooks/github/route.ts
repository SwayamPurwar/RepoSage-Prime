// app/api/webhooks/github/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { repos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('x-hub-signature-256')

  // 1. Verify the webhook secret (Security)
  // You'll set this 'GITHUB_WEBHOOK_SECRET' in your .env and GitHub settings
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')

  if (signature !== digest) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(payload)
  const repoUrl = event.repository?.html_url

  // 2. We only care about 'push' events for now
  if (req.headers.get('x-github-event') === 'push' && repoUrl) {
    console.log(`🚀 Webhook received: Push to ${repoUrl}`)

    // 3. Find the repo in our database
    const existingRepo = await db
      .select()
      .from(repos)
      .where(eq(repos.repoUrl, repoUrl))
      .limit(1)

    if (existingRepo.length > 0) {
      const repoId = existingRepo[0].id

      // 4. Trigger the Ingest API internally
      // In a production app, you would move the indexing logic to a 
      // Background Job (like Inngest or BullMQ) to avoid timeout.
      // For now, we'll ping your ingest route.
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl, forceReindex: true }),
        })
        console.log(`✅ Automated re-indexing started for ${repoId}`)
      } catch (err) {
        console.error('Failed to trigger auto-ingest:', err)
      }
    }
  }

  return NextResponse.json({ received: true })
}