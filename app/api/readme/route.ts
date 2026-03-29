// app/api/readme/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

type ChunkRow = {
  file_path: string
  content: string
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { repoId } = await req.json()

    if (!repoId) {
      return NextResponse.json({ error: 'Repository ID is required.' }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Fetch a diverse set of unique files from the repository to understand the architecture
    // LIMIT 40 gives the AI enough context (package.json, configs, main entry points) 
    // without overflowing the context window.
    const rows = await sql`
      SELECT DISTINCT ON (file_path) 
        file_path, content
      FROM embeddings
      WHERE repo_id = ${repoId}::uuid
      ORDER BY file_path, chunk_index
      LIMIT 40
    `
    const files = rows as unknown as ChunkRow[]

    if (files.length === 0) {
      return NextResponse.json({ 
        error: 'No indexed files found. Please make sure the repository is fully indexed.' 
      }, { status: 400 })
    }

    // Truncate contents slightly to ensure we don't blow past token limits
    const contextChunks = files.map((f) => `File: ${f.file_path}\n${f.content.substring(0, 1500)}`).join('\n\n---\n\n')

    const prompt = `You are an expert technical writer and senior software engineer. 
    Analyze the following codebase files and generate a comprehensive, professional, and beautiful README.md file for this project.
    
    The README must include:
    - An engaging Project Title and brief description
    - 🚀 Features List
    - 🛠 Tech Stack (infer from the files/dependencies)
    - 📁 Project Structure (a brief tree or explanation of the main directories)
    - 💻 Getting Started / Local Setup Instructions
    
    Format it perfectly in Markdown. Do not include any conversational filler, output strictly the Markdown content.

    CODEBASE CONTEXT:
    ${contextChunks}`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Fast and excellent at text generation
      contents: prompt,
    })

    return NextResponse.json({ readme: response.text })

  } catch (error) {
    console.error('README Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate README. Please try again later.' },
      { status: 500 }
    )
  }
}