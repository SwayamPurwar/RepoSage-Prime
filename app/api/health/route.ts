import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { healthReports } from '@/lib/schema'
import { analyzeCodeHealth } from '@/lib/groq'
import { neon } from '@neondatabase/serverless'
import { desc, eq } from 'drizzle-orm'
import { checkRepoLimit } from '@/lib/billing'
import { z } from 'zod'
import { getAiRateLimiter } from '@/lib/ratelimit'

// --- INPUT & AI OUTPUT SCHEMAS ---
const healthRequestSchema = z.object({
  repoId: z.string().uuid("Invalid Repository ID")
})

// We use Zod to forcefully validate the AI's unpredictable JSON output
const aiHealthResponseSchema = z.object({
  overallScore: z.coerce.number().min(0).max(100).default(0),
  complexityScore: z.coerce.number().min(0).max(100).default(0),
  documentationScore: z.coerce.number().min(0).max(100).default(0),
  duplicateScore: z.coerce.number().min(0).max(100).default(0),
  bugRiskScore: z.coerce.number().min(0).max(100).default(0),
  suggestions: z.any().default([]), // Capture whatever JSON array the AI returns
})

type HealthChunkRow = { file_path: string; content: string }

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Validate Input
    const rawBody = await req.json()
    const parseResult = healthRequestSchema.safeParse(rawBody)
    if (!parseResult.success) return NextResponse.json({ error: 'Invalid repoId' }, { status: 400 })
    
    const { repoId } = parseResult.data

    // 2. Rate Limit
    const rateLimiter = getAiRateLimiter('hobby');
const { success, limit, reset, remaining } = await rateLimiter.limit(userId);
    if (!success) {
      return NextResponse.json({ error: 'Health scan limit exceeded. Please wait.' }, { 
        status: 429,
        headers: { 'X-RateLimit-Limit': limit.toString(), 'X-RateLimit-Remaining': remaining.toString() }
      })
    }

    // 3. Billing & Context Limits
    const billingCheck = await checkRepoLimit(userId)
    const currentPlan = billingCheck.plan
    const contextChunkLimit = (currentPlan === 'pro' || currentPlan === 'enterprise') ? 60 : 30

    // 4. Fetch Chunks
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`
      SELECT DISTINCT ON (file_path) file_path, content
      FROM embeddings
      WHERE repo_id = ${repoId}::uuid
      ORDER BY file_path, chunk_index
      LIMIT ${contextChunkLimit}
    `
    const allChunks = rows as unknown as HealthChunkRow[]

    if (allChunks.length === 0) {
      return NextResponse.json({ error: 'No indexed files found. Please index the repo first.' }, { status: 400 })
    }

    const files = allChunks.map((c) => ({ path: c.file_path, content: c.content }))

    // 5. AI Generation
    const rawHealthData = await analyzeCodeHealth(files, currentPlan)
    if (!rawHealthData) {
      return NextResponse.json({ error: 'Health analysis failed to return data' }, { status: 502 })
    }

    // 6. Safe JSON Parsing & Zod Validation of AI Output
    let parsedJson;
    try {
      const cleanString = typeof rawHealthData === 'string' 
        ? rawHealthData.replace(/```(json)?/gi, '').trim() 
        : JSON.stringify(rawHealthData);
      parsedJson = JSON.parse(cleanString);
    } catch (e) {
      console.error("AI returned malformed JSON:", rawHealthData);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 });
    }

    // This guarantees our data perfectly matches our Drizzle DB types!
    const validatedHealthData = aiHealthResponseSchema.parse(parsedJson);

    // 7. Save Report
    const report = await db.insert(healthReports).values({
      repoId,
      userId,
      ...validatedHealthData
    }).returning()

   const reportRecord = report[0];
if (!reportRecord) return NextResponse.json({ error: "Report failed" }, { status: 500 });

return NextResponse.json({ health: validatedHealthData, reportId: reportRecord.id });

  } catch (error) {
    console.error('[HEALTH_API_ERROR]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const repoId = searchParams.get('repoId')

    // Reuse Zod for GET param validation
    const parseResult = healthRequestSchema.safeParse({ repoId })
    if (!parseResult.success) return NextResponse.json({ error: 'Valid repoId required' }, { status: 400 })

    const report = await db.select()
      .from(healthReports)
      .where(eq(healthReports.repoId, parseResult.data.repoId))
      .orderBy(desc(healthReports.createdAt))
      .limit(1)

    return NextResponse.json({ report: report.length > 0 ? report[0] : null })
  } catch (error) {
    console.error('[HEALTH_GET_ERROR]:', error)
    return NextResponse.json({ error: 'Failed to load health report' }, { status: 500 })
  }
}