import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { analytics } from '@/lib/schema'
import { z } from 'zod'
import { getAiRateLimiter } from '@/lib/ratelimit'

// --- STRICT ANALYTICS SCHEMA ---
const analyticsSchema = z.object({
  event_type: z.string().min(1, "Event type required").max(100, "Event type too long"),
  feature: z.string().max(100).optional(),
  // Prevent database bloat by limiting metadata to a 2KB string representation
 metadata: z.record(z.string(), z.any()).optional().default({}).refine(
    (data) => JSON.stringify(data).length < 2000, 
    { message: "Metadata payload is too large" }
  )
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown'

    // 1. Rate Limit (Prevent DB Spam)
    // Using a broader limit since analytics fire often (e.g., page views)
   const identifier = userId || ipAddress;
    const rateLimiter = getAiRateLimiter('hobby');
    const { success, limit, reset, remaining } = await rateLimiter.limit(identifier);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // 2. Strict Payload Validation
    const rawBody = await req.json()
    const parseResult = analyticsSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 })
    }

    const { event_type, feature, metadata } = parseResult.data

    const mergedMetadata = {
      ...(feature ? { feature } : {}),
      ...metadata
    }

    // 3. Non-blocking Database Insert
    // We don't await this so the client gets a lightning-fast <10ms response
    db.insert(analytics).values({
      eventType: event_type,
      userId: userId || 'anonymous',
      ipAddress,
      metadata: mergedMetadata,
    }).catch(err => console.error('[ANALYTICS_DB_ERROR]:', err))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[ANALYTICS_ROUTE_ERROR]:', error)
    return NextResponse.json({ error: 'Failed to log analytics' }, { status: 500 })
  }
}