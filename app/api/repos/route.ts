// app/api/repos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { repos } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all repositories for the authenticated user, newest first
    const userRepos = await db
      .select()
      .from(repos)
      .where(eq(repos.userId, userId))
      .orderBy(desc(repos.createdAt))

    return NextResponse.json({ repos: userRepos })
  } catch (error) {
    console.error('Failed to fetch repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}