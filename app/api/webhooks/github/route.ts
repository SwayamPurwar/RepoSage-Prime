import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { repos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { inngest } from '@/lib/inngest/client'
import { clerkClient } from '@clerk/nextjs/server'
import { EmitterWebhookEvent } from "@octokit/webhooks";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const signature = req.headers.get('x-hub-signature-256')

    // 1. Verify GitHub Signature
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')

    if (signature !== digest) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(payload)
    const repoUrl = event.repository?.html_url

    // 2. Only process push events to the default branch
    if (req.headers.get('x-github-event') === 'push' && repoUrl) {
      const branchPushed = event.ref?.replace('refs/heads/', '')
      const defaultBranch = event.repository?.default_branch || 'main'

      // We only want to re-index if they pushed to main/master to save compute
      if (branchPushed !== defaultBranch) {
        return NextResponse.json({ message: 'Ignored non-default branch push' }, { status: 200 })
      }

      console.log(`🚀 Webhook received: Push to ${repoUrl}`)

      // 3. Find Repo in Database
      const existingRepo = await db
        .select()
        .from(repos)
        .where(eq(repos.repoUrl, repoUrl))
        .limit(1)

     if (existingRepo.length > 0) {
        const repoData = existingRepo[0]
        
        if (!repoData) {
           return NextResponse.json({ error: "Repository not found" }, { status: 404 });
        }

        // Now you can safely use repoData.id, repoData.userId, etc.

// Now you can safely use repoData.id, repoData.userId, etc.
await db.update(repos).set({ isIndexed: 0 }).where(eq(repos.id, repoData.id));
        // 5. Fetch the user's GitHub token via Clerk Server Client
        let githubToken = process.env.GITHUB_TOKEN // Fallback to global token
        try {
          const client = await clerkClient()
          const tokenRes = await client.users.getUserOauthAccessToken(repoData.userId, 'oauth_github')
          if (tokenRes.data && tokenRes.data.length > 0) {
            githubToken = tokenRes.data[0]?.token
          }
        } catch (e) {
          console.warn(`Failed to fetch OAuth token for user ${repoData.userId}`)
        }

        if (!githubToken) {
           console.error("Cannot re-index without a valid GitHub token.")
           return NextResponse.json({ error: 'No GitHub token' }, { status: 400 })
        }

        // 6. DIRECTLY trigger the Inngest background job (Do NOT use fetch!)
        await inngest.send({
          name: "repo/index.requested",
          data: {
            repoId: repoData.id,
            owner: repoData.owner,
            repoName: repoData.repoName,
            token: githubToken,
            branch: defaultBranch
          },
        });

        console.log(`✅ Automated re-indexing background job queued for ${repoData.id}`)
      }
    }

    // Always return 200 quickly so GitHub doesn't retry
    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('[GITHUB_WEBHOOK_ERROR]:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}