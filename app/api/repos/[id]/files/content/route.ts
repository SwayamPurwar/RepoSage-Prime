import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Await the params to extract the id
  const { id } = await params;

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return NextResponse.json({ error: 'File path required' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // 2. Use the awaited 'id' variable here instead of 'params.id'
    const rows = await sql`
      SELECT content 
      FROM embeddings 
      WHERE repo_id = ${id}::uuid AND file_path = ${filePath} 
      ORDER BY chunk_index ASC
    `
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Stitch the file back together (removing the "File: xyz.ts\n\n" prefix from the first chunk)
    let fullContent = rows.map((r: any) => r.content).join('\n')
    fullContent = fullContent.replace(new RegExp(`^File: ${filePath}\n\n`), '')

    return NextResponse.json({ content: fullContent })
  } catch (error) {
    console.error('Failed to fetch file content:', error)
    return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 500 })
  }
}