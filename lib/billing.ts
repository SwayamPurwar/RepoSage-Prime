// lib/billing.ts
import { db } from '@/lib/db'
import { users, repos } from '@/lib/schema'
import { eq, count } from 'drizzle-orm'

export const PLAN_LIMITS = {
  hobby: {
    maxRepos: 3,
    allowPrivate: false,
    model: 'llama-3.3-70b-versatile'
  },
  pro: {
    maxRepos: 100, // Practically unlimited for most users
    allowPrivate: true,
    model: 'gemini-1.5-pro'
  },
  enterprise: {
    maxRepos: 9999,
    allowPrivate: true,
    model: 'gpt-4o'
  }
}

export async function checkRepoLimit(userId: string) {
  // 1. Get user plan
  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    
  const plan = (userRecords[0]?.plan || 'hobby') as keyof typeof PLAN_LIMITS

  // 2. Count current repos
  const repoCountRes = await db
    .select({ value: count() })
    .from(repos)
    .where(eq(repos.userId, userId))
    
 const currentRepos = repoCountRes[0]?.value ?? 0

  const limit = PLAN_LIMITS[plan].maxRepos

  if (currentRepos >= limit) {
    return {
      allowed: false,
      reason: `You have reached the limit of ${limit} repositories on the ${plan.toUpperCase()} plan.`,
      plan
    }
  }

  return { allowed: true, plan }
}