// app/api/onboarding/route.ts
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

    // Fetch up to 40 unique file chunks to give the AI a wide view of the architecture
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

    // Truncate contents slightly to stay well within token limits
    const contextChunks = files.map((f) => `File: ${f.file_path}\n${f.content.substring(0, 1500)}`).join('\n\n---\n\n')

    const prompt = `You are a Senior Technical Lead creating an onboarding guide for a new developer joining this project.
    Based on the following codebase files, generate a comprehensive, welcoming, and technical onboarding document.
    
    The document MUST include:
    - 🎯 Project Overview & Goals
    - 🏗️ High-Level Architecture (How the pieces fit together)
    - 🔑 Key Technologies & Dependencies
    - 🚀 Local Development Setup (Step-by-step inferred from config files)
    - 📁 Folder Structure Conventions (Where should they look for things?)
    
    Format it perfectly in Markdown. Do not include any conversational filler, output strictly the Markdown content.

    CODEBASE CONTEXT:
    ${contextChunks}`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Fast, massive context window
      contents: prompt,
    })

    return NextResponse.json({ onboarding: response.text })

  } catch (error) {
    console.error('Onboarding Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Onboarding Guide. Please try again later.' },
      { status: 500 }
    )
  }
}