import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { reviews } from '@/lib/schema'
import { reviewCode } from '@/lib/groq'
import { generateEmbedding } from '@/lib/embeddings'
import { neon } from '@neondatabase/serverless'
import { eq, desc } from 'drizzle-orm'
import { parsePRUrl, postPRComment } from '@/lib/github'
import { checkRepoLimit } from '@/lib/billing'
import { z } from 'zod'
import { getAiRateLimiter } from '@/lib/ratelimit'

// --- STRICT INPUT SCHEMA ---
const reviewRequestSchema = z.object({
  repoId: z.string().uuid("Invalid Repository ID"),
  codeSnippet: z.string().min(5, "Code snippet is too short").max(50000, "Code snippet is too large to process"),
  prUrl: z.string().url().optional().or(z.literal('')), // Accept valid URL or empty string
})

const reviewQuerySchema = z.object({
  repoId: z.string().uuid("Invalid Repository ID")
})

type ReviewContextRow = {
  content: string
  file_path: string
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Rate Limiting
   const rateLimiter = getAiRateLimiter('hobby');
const { success, limit, reset, remaining } = await rateLimiter.limit(userId);
    if (!success) {
      return NextResponse.json({ error: 'Review limit exceeded. Please wait.' }, { 
        status: 429,
        headers: { 'X-RateLimit-Limit': limit.toString(), 'X-RateLimit-Remaining': remaining.toString() }
      })
    }

    // 2. Strict Input Validation
    const rawBody = await req.json()
    const parseResult = reviewRequestSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 })
    }

    const { repoId, codeSnippet, prUrl } = parseResult.data

    // 3. Billing & Context Limits
    const billingCheck = await checkRepoLimit(userId)
    const currentPlan = billingCheck.plan
    const contextChunkLimit = (currentPlan === 'pro' || currentPlan === 'enterprise') ? 15 : 5

    // 4. Vector Search for Context
    const sql = neon(process.env.DATABASE_URL!)
    const codeEmbedding = await generateEmbedding(codeSnippet)
    const vectorStr = `[${codeEmbedding.join(',')}]`

    const rows = await sql`
      SELECT content, file_path
      FROM embeddings
      WHERE repo_id = ${repoId}::uuid
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${contextChunkLimit}
    `
    const contextChunks = rows as unknown as ReviewContextRow[]
    const context = contextChunks.map((c) => `File: ${c.file_path}\n${c.content}`).join('\n\n---\n\n')

    // 5. AI Generation
    let reviewContent: string
    try {
      reviewContent = (await reviewCode(codeSnippet, context, currentPlan)) ?? "AI review unavailable."
    } catch (e) {
      console.error('[AI_REVIEW_ERROR]:', e)
      reviewContent = "AI review currently unavailable. Our models are busy, please try again later."
    }

    // 6. Asynchronous Side Effects (DB Insert & GitHub PR Comment)
    // We run these concurrently so the user isn't waiting as long
    const sideEffects = [
      db.insert(reviews).values({
        repoId,
        userId,
        prUrl: prUrl || null,
        codeSnippet,
        reviewContent,
      }).catch(err => console.error('[REVIEW_DB_SAVE_ERROR]:', err))
    ]

    // 7. GitHub PR Integration (Authenticated as the User)
    if (prUrl) {
      sideEffects.push((async () => {
        try {
          const { owner, repo, prNumber } = parsePRUrl(prUrl)
          let githubToken = process.env.GITHUB_TOKEN // Fallback

          // Attempt to get the actual user's token so the comment comes from THEM
          try {
            const client = await clerkClient()
            const tokenRes = await client.users.getUserOauthAccessToken(userId, 'oauth_github')
            if (tokenRes.data && tokenRes.data.length > 0) {
              githubToken = tokenRes.data[0]?.token
            }
          } catch (e) {
            console.warn(`Failed to fetch OAuth token for user ${userId}`)
          }
          
          if (githubToken) {
            const commentBody = `🤖 **RepoSage Prime AI Review**\n\n${reviewContent}`
            await postPRComment(owner, repo, prNumber, commentBody, githubToken)
            console.log(`Successfully posted AI review to PR #${prNumber}`)
          }
        } catch (githubError) {
          console.error('[GITHUB_PR_COMMENT_ERROR]:', githubError)
        }
      })())
    }

    await Promise.all(sideEffects)

    return NextResponse.json({ review: reviewContent })

  } catch (error) {
    console.error('[REVIEW_ROUTE_ERROR]:', error)
    return NextResponse.json({ error: 'Internal server error processing review' }, { status: 500 })
  }
}

// Get review history
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const parseResult = reviewQuerySchema.safeParse({ repoId: searchParams.get('repoId') })
    
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Valid repoId required' }, { status: 400 })
    }

    const history = await db.select()
      .from(reviews)
      .where(eq(reviews.repoId, parseResult.data.repoId))
      .orderBy(desc(reviews.createdAt)) // Changed to standard desc() import
      .limit(20)

    return NextResponse.json({ history })
  } catch (error) {
    console.error('[REVIEW_GET_ERROR]:', error)
    return NextResponse.json({ error: 'Failed to load review history' }, { status: 500 })
  }
}