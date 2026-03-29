// app/api/user/keys/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { apiKeys } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Generate a secure random key using the Web Crypto API (Edge compatible)
    const rawKey = crypto.randomUUID().replace(/-/g, '')
    const key = `cs_${rawKey}`

    // Delete any existing key for this user so they only have one active key
    await db.delete(apiKeys).where(eq(apiKeys.userId, userId))

    // Insert the newly generated key
    const newKey = await db.insert(apiKeys).values({
      userId,
      key,
      name: 'VS Code Extension'
    }).returning()

    return NextResponse.json({ key: newKey[0].key })
  } catch (error) {
    console.error('Failed to generate API key:', error)
    return NextResponse.json(
      { error: 'Failed to generate key' }, 
      { status: 500 }
    )
  }
}