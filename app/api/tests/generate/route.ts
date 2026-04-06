import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateEmbedding } from '@/lib/embeddings'
import { neon } from '@neondatabase/serverless'
import { generateTestCode } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { repoId, filePath, codeContent } = await req.json()

  if (!repoId || !filePath || !codeContent) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // 1. Generate an embedding for the file to find its dependencies
    const fileEmbedding = await generateEmbedding(codeContent)
    const vectorStr = `[${fileEmbedding.join(',')}]`

    // 2. Fetch up to 3 related files to provide context for mocking
    const rows = await sql`
      SELECT content, file_path
      FROM embeddings
      WHERE repo_id = ${repoId}::uuid AND file_path != ${filePath}
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT 3
    `
    const context = rows.map((r: any) => `File: ${r.file_path}\n${r.content}`).join('\n\n')

    // 3. Generate the test via Groq (We will add this function next)
    let testCode = await generateTestCode(filePath, codeContent, context)

    // Clean up any markdown code block formatting the LLM might have added
    testCode = testCode.replace(/^```[\w]*\n/, '').replace(/\n```$/, '')

    return NextResponse.json({ testCode })

  } catch (error) {
    console.error('Test generation error:', error)
    return NextResponse.json({ error: 'Failed to generate test' }, { status: 500 })
  }
}