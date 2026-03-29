// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { analytics } from '@/lib/schema'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await req.json()
    const { event_type, feature, metadata } = body

    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
    }

    // Extract client IP from common proxy headers
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'

    // Combine any extra data into the metadata JSON block
    const mergedMetadata = {
      ...(feature ? { feature } : {}),
      ...(metadata || {})
    }

    await db.insert(analytics).values({
      eventType: event_type,
      userId: userId || 'anonymous',
      ipAddress,
      metadata: mergedMetadata,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to log analytics' },
      { status: 500 }
    )
  }
}