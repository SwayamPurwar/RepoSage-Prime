import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { repos, usageLogs } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { neon } from '@neondatabase/serverless'
import { GoogleGenAI } from "@google/genai"
import { z } from 'zod'
import { getAiRateLimiter } from '@/lib/ratelimit'

// Initialize Gemini (Best model for massive context windows)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// --- STRICT VALIDATION SCHEMA ---
const onboardingSchema = z.object({
  repoId: z.string().uuid("Invalid Repository ID"),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Input Validation
    const rawBody = await req.json()
    const parseResult = onboardingSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 })
    }
    const { repoId } = parseResult.data

    // 2. Rate Limiting (Strict limit for large context window tasks)
   const rateLimiter = getAiRateLimiter('hobby');
const { success, limit, reset, remaining } = await rateLimiter.limit(userId);
    if (!success) {
      return NextResponse.json({ error: 'Onboarding generation limit exceeded. Please wait.' }, {
        status: 429,
        headers: { 'X-RateLimit-Limit': limit.toString(), 'X-RateLimit-Remaining': remaining.toString() }
      })
    }

    // 3. Verify Ownership & Fetch Repo Details
    const repoRecs = await db.select().from(repos).where(eq(repos.id, repoId)).limit(1)
    const repo = repoRecs[0]
    if (!repo) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })

    // 4. Gather Comprehensive Codebase Context
    const sql = neon(process.env.DATABASE_URL!)

    // Run queries concurrently to speed up database reads!
    const [filePathsData, packageJsonData, readmeData, chunksData] = await Promise.all([
      sql`SELECT DISTINCT file_path FROM embeddings WHERE repo_id = ${repoId}::uuid`,
      sql`SELECT content FROM embeddings WHERE repo_id = ${repoId}::uuid AND file_path ILIKE '%package.json%' LIMIT 1`,
      sql`SELECT content FROM embeddings WHERE repo_id = ${repoId}::uuid AND file_path ILIKE '%readme.md%' LIMIT 1`,
      sql`SELECT DISTINCT ON (file_path) file_path, content FROM embeddings WHERE repo_id = ${repoId}::uuid ORDER BY file_path, chunk_index LIMIT 30`
    ])

    const filePaths = filePathsData.map((r: any) => r.file_path).join('\n')
    const packageJson = packageJsonData.length > 0 ? packageJsonData[0]?.content || '' : 'No package.json found'
    const readme = readmeData.length > 0 ? readmeData[0]?.content || '' : 'No README found'

    if (chunksData.length === 0) {
      return NextResponse.json({ error: 'No indexed files found. Please index the repo first.' }, { status: 400 })
    }

    const contextChunks = chunksData.map((f: any) => `File: ${f.file_path}\n${f.content.substring(0, 1500)}`).join('\n\n---\n\n')

    // 5. Asynchronous Usage Logging
    // Log tokens silently in the background
   db.insert(usageLogs).values({
      userId,
      actionType: 'agent', // <-- FIXED
      tokensUsed: Math.ceil((filePaths.length + packageJson.length + contextChunks.length) / 4),
    }).catch(err => console.error('[USAGE_LOG_ERROR]:', err))

    // 6. The Architect System Prompt
    const prompt = `You are a Staff Engineer creating a comprehensive onboarding guide for new developers.
Project Name: ${repo.repoName}
Description: ${repo.description}
Language: ${repo.language}

File Structure:
${filePaths}

Dependencies (package.json):
${packageJson}

Existing README:
${readme}

Code Snippets:
${contextChunks}

Write a beautifully formatted Markdown "Onboarding Guide". Output ONLY Markdown. Do not include introductory conversational filler.
Include these specific sections:
1. 🎯 Project Overview & Goals
2. 🏗️ High-Level Architecture (How the pieces fit together)
3. 📦 Key Technologies & Dependencies
4. 🚀 Local Development Setup (Step-by-step inferred from config files)
5. 📁 Folder Structure Conventions
6. 🤝 Best Practices & Contribution Guidelines`

    // 7. Generate Content with Gemini 2.5 Flash
    // We use Gemini here because 2.5 Flash has a 1 Million Token context window, perfect for massive codebases.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    return NextResponse.json({ onboarding: response.text })

  } catch (error) {
    console.error('[ONBOARDING_API_ERROR]:', error)
    return NextResponse.json({ error: 'Failed to generate Onboarding Guide.' }, { status: 500 })
  }
}