import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { repos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { neon } from '@neondatabase/serverless'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { repoId } = await req.json()
    if (!repoId) return NextResponse.json({ error: 'Repo ID required' }, { status: 400 })

    // 2. Verify repo ownership
    const repoRecs = await db.select().from(repos).where(eq(repos.id, repoId))
    const repo = repoRecs[0]
    if (!repo) return NextResponse.json({ error: 'Repository not found' }, { status: 404 })

    // 3. Connect to Neon DB to fetch targeted context
    const sql = neon(process.env.DATABASE_URL!)

    // Grab the unique file paths to understand the architecture
    const filePathsData = await sql`SELECT DISTINCT file_path FROM embeddings WHERE repo_id = ${repoId}`
    const filePaths = filePathsData.map(r => r.file_path).join('\n')

    // Grab package.json to understand dependencies
    const packageJsonData = await sql`SELECT content FROM embeddings WHERE repo_id = ${repoId} AND file_path LIKE '%package.json%' LIMIT 1`
   const packageJson = packageJsonData[0]?.content ?? 'No package.json found';

    // Grab README for general context
    const readmeData = await sql`SELECT content FROM embeddings WHERE repo_id = ${repoId} AND file_path ILIKE '%readme.md%' LIMIT 1`
    const readme = readmeData[0]?.content ?? 'No README found';

    // 4. The Senior Engineer System Prompt
    const prompt = `You are a Senior Staff Engineer. Write a comprehensive, beautifully formatted Markdown "Onboarding Guide" for new developers joining this project.
    
    Project Name: ${repo.repoName}
    Description: ${repo.description}
    Language: ${repo.language}
    
    File Structure:
    ${filePaths}
    
    Dependencies (package.json):
    ${packageJson}
    
    Existing README context:
    ${readme}
    
    Output ONLY Markdown. Do not include introductory text like "Here is the guide". Include these specific sections:
    1. 🚀 Project Overview & Architecture
    2. 📦 Key Technologies & Dependencies
    3. 🛠️ Getting Started (Installation & Scripts)
    4. 📁 Folder Structure (Explain where things live based on the paths provided)
    5. 🤝 Best Practices & Contribution Guidelines
    `

    // 5. Generate Guide with Groq
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Using the 70b model for better technical writing
      temperature: 0.3,
    })

   const onboarding = completion.choices[0]?.message?.content;
if (!onboarding) throw new Error("Failed to generate onboarding content");

    return NextResponse.json({ onboarding })

  } catch (error: any) {
    console.error("Onboarding Generation Error:", error)
    return NextResponse.json({ error: "Failed to generate onboarding guide." }, { status: 500 })
  }
}