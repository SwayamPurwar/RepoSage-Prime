import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { healthReports } from '@/lib/schema'
import { analyzeCodeHealth } from '@/lib/groq'
import { neon } from '@neondatabase/serverless'
import { desc, eq } from 'drizzle-orm'
import { checkRepoLimit } from '@/lib/billing' // NEW: Import billing logic

type HealthChunkRow = {
  file_path: string
  content: string
}

type ParsedHealthData = {
  overallScore: number
  complexityScore: number
  documentationScore: number
  duplicateScore: number
  bugRiskScore: number
  suggestions: unknown
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { repoId } = await req.json()

  if (!repoId) {
    return NextResponse.json({ error: 'repoId required' }, { status: 400 })
  }

  try {
    // NEW: Check the user's plan
    const billingCheck = await checkRepoLimit(userId)
    const currentPlan = billingCheck.plan

    // Pro users get double the context for health analysis
    const contextChunkLimit = (currentPlan === 'pro' || currentPlan === 'enterprise') ? 60 : 30

    const sql = neon(process.env.DATABASE_URL!)

    // Fetch diverse file chunks for this repo
    const rows = await sql`
      SELECT DISTINCT ON (file_path) 
        file_path, content
      FROM embeddings
      WHERE repo_id = ${repoId}::uuid
      ORDER BY file_path, chunk_index
      LIMIT ${contextChunkLimit}
    `
    const allChunks = rows as unknown as HealthChunkRow[]

    if (allChunks.length === 0) {
      return NextResponse.json({ 
        error: 'No indexed files found. Please index the repo first.' 
      }, { status: 400 })
    }

    const files = allChunks.map((c) => ({ 
      path: c.file_path, 
      content: c.content 
    }))

    // Analyze health and normalize model output into a typed object
    const healthRaw = await analyzeCodeHealth(files, currentPlan)
    if (!healthRaw) {
      return NextResponse.json(
        { error: 'Health analysis returned no result' },
        { status: 500 }
      )
    }

    const cleanedHealthRaw = healthRaw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(cleanedHealthRaw) as Record<string, unknown>
    } catch {
      return NextResponse.json(
        { error: 'Health analysis returned invalid JSON' },
        { status: 500 }
      )
    }

    const complexity = Number(parsed.complexity ?? parsed.complexityScore ?? 0)
    const documentation = Number(parsed.documentation ?? parsed.documentationScore ?? 0)
    const bugRisk = Number(parsed.bugs ?? parsed.bugRisk ?? parsed.bugRiskScore ?? 0)
    const duplicate = Number(parsed.duplicate ?? parsed.duplicateScore ?? 0)
    const overall = Number(parsed.overall ?? parsed.overallScore ?? Math.round((complexity + documentation + (100 - bugRisk)) / 3))

    const healthData: ParsedHealthData = {
      overallScore: Number.isFinite(overall) ? overall : 0,
      complexityScore: Number.isFinite(complexity) ? complexity : 0,
      documentationScore: Number.isFinite(documentation) ? documentation : 0,
      duplicateScore: Number.isFinite(duplicate) ? duplicate : 0,
      bugRiskScore: Number.isFinite(bugRisk) ? bugRisk : 0,
      suggestions: parsed.summary ?? parsed.suggestions ?? null,
    }

    // Save report
    const report = await db.insert(healthReports).values({
      repoId,
      userId,
      overallScore: healthData.overallScore,
      complexityScore: healthData.complexityScore,
      documentationScore: healthData.documentationScore,
      duplicateScore: healthData.duplicateScore,
      bugRiskScore: healthData.bugRiskScore,
      suggestions: healthData.suggestions,
    }).returning()

    return NextResponse.json({ 
      health: healthData,
      reportId: report[0].id
    })

  } catch (error) {
    console.error('Health error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Health analysis failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const repoId = searchParams.get('repoId')

  if (!repoId) {
    return NextResponse.json({ error: 'repoId required' }, { status: 400 })
  }

  try {
    const report = await db.select()
      .from(healthReports)
      .where(eq(healthReports.repoId, repoId))
      .orderBy(desc(healthReports.createdAt))
      .limit(1)

    if (report.length === 0) {
      return NextResponse.json({ report: null })
    }

    return NextResponse.json({ report: report[0] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load health report' },
      { status: 500 }
    )
  }
}