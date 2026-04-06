// app/api/repos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { repos, users, usageLogs } from '@/lib/schema' 
import { eq, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// =======================================================================
// --- INITIALIZE RATE LIMITER (10 requests per 10 seconds per user) ---
// =======================================================================
const redis = Redis.fromEnv()
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true, 
})

// =======================================================================
// --- INPUT VALIDATION SCHEMA ---
// =======================================================================
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20), // Max 100 per request
})

export async function GET(req: NextRequest) {
  try {
    // 1. Authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' }, 
        { status: 401 }
      )
    }

    // 2. Rate Limiting
    const { success, limit, reset, remaining } = await ratelimit.limit(`repos_get_${userId}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    // 3. Validate Query Parameters (Pagination)
    const url = new URL(req.url)
    
    // --- FIX: Add `?? undefined` so Zod's defaults will trigger properly ---
    const queryValidation = querySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: queryValidation.error.flatten() },
        { status: 400 }
      )
    }

    const { page, limit: pageSize } = queryValidation.data
    const offset = (page - 1) * pageSize

   // 4. Database Queries (Execute concurrently for speed)
    const [userRepos, userRecords, usageRecords] = await Promise.all([
      // Fetch repositories
      db.select()
        .from(repos)
        .where(eq(repos.userId, userId))
        .orderBy(desc(repos.createdAt))
        .limit(pageSize)
        .offset(offset),
        
      // Fetch user plan
      db.select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
        
      // NEW: Calculate total tokens used by this user
      db.select({ totalTokens: sql<number>`sum(${usageLogs.tokensUsed})` })
        .from(usageLogs)
        .where(eq(usageLogs.userId, userId))
    ])

    const plan = userRecords[0]?.plan || 'hobby'
    const tokensUsed = Number(usageRecords[0]?.totalTokens || 0)

    // 5. Mapped Response Format
    return NextResponse.json({
      repos: userRepos,
      plan: plan,
      tokensUsed: tokensUsed, // <-- NEW: Send tokens to frontend
      meta: {
        page,
        limit: pageSize,
        count: userRepos.length,
      }
    })

  } catch (error) {
    // 6. Secure Error Logging
    // We log the real error to our server console, but send a generic message to the client
    console.error('[API_REPOS_GET_ERROR]:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}