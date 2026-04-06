import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { neon } from '@neondatabase/serverless'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. Update the type to a Promise
) {
  // 2. Await the params to get the id
  const { id } = await params;

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // 3. Use the awaited 'id' instead of 'params.id'
    const rows = await sql`
      SELECT DISTINCT file_path 
      FROM embeddings 
      WHERE repo_id = ${id}::uuid
      ORDER BY file_path ASC
    `
    
    const files = rows.map((r: any) => r.file_path)

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Failed to fetch file list:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}