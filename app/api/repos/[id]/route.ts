// app/api/repos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { repos, embeddings, chats, reviews, healthReports } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

// GET a specific repository
export async function GET(
  req: NextRequest,
 { params }: { params: Promise<{ id: string }> } 
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    console.log("Looking for Repo ID:", id, "for User ID:", userId)

    const repoRecords = await db
      .select()
      .from(repos)
      .where(and(eq(repos.id, id), eq(repos.userId, userId)))
      .limit(1)

    if (repoRecords.length === 0) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    return NextResponse.json({ repo: repoRecords[0] })
  } catch (error) {
    console.error('Failed to fetch repository:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repository' },
      { status: 500 }
    )
  }
}

// DELETE a specific repository and its associated data
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // First, verify the user owns this repository
    const repoRecords = await db
      .select()
      .from(repos)
      .where(and(eq(repos.id, id), eq(repos.userId, userId)))
      .limit(1)

    if (repoRecords.length === 0) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Delete related data first to avoid orphaned records 
    // (If cascading deletes aren't configured in the database schema)
    await db.delete(embeddings).where(eq(embeddings.repoId, id))
    await db.delete(chats).where(eq(chats.repoId, id))
    await db.delete(reviews).where(eq(reviews.repoId, id))
    await db.delete(healthReports).where(eq(healthReports.repoId, id))

    // Finally, delete the repository record itself
    await db.delete(repos).where(eq(repos.id, id))

    return NextResponse.json({ success: true, message: 'Repository deleted successfully' })
  } catch (error) {
    console.error('Failed to delete repository:', error)
    return NextResponse.json(
      { error: 'Failed to delete repository' },
      { status: 500 }
    )
  }
}