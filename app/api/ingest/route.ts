import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { repos, users } from '@/lib/schema' // <-- ADDED: users table
import { parseGitHubUrl, getRepoInfo } from '@/lib/github'
import { checkRepoLimit, PLAN_LIMITS } from '@/lib/billing'
import { inngest } from '@/lib/inngest/client'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const { repoUrl, branch = 'main' } = await req.json()
    if (!repoUrl) return new NextResponse('Repo URL required', { status: 400 })

    const client = await clerkClient() // Initialize Clerk once

    // --- 1. JUST-IN-TIME USER CREATION ---
    // Prevents Foreign Key Constraint errors by ensuring the user exists in Postgres
    const userDbCheck = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (userDbCheck.length === 0) {
      try {
        const clerkUser = await client.users.getUser(userId)
        // Safely extract the primary email
        const primaryEmail = clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || 'no-email@example.com'

        await db.insert(users).values({
          id: userId,
          email: primaryEmail,
          plan: 'hobby'
        })
      } catch (e) {
        console.error('Failed to create user in DB:', e)
        return NextResponse.json({ error: 'Failed to initialize user profile.' }, { status: 500 })
      }
    }

    // --- 2. Fetch Token ---
    let githubToken = process.env.GITHUB_TOKEN;
    try {
      // NOTE: Removed 'oauth_' prefix to fix the Clerk deprecation warning you saw in the terminal!
      const response = await client.users.getUserOauthAccessToken(userId, 'github')
      if (response.data && response.data.length > 0) {
         githubToken = response.data[0]?.token
      }
    } catch (e) {
      console.warn('Failed to fetch user GitHub token', e)
    }

    if (!githubToken) {
      return NextResponse.json({ error: 'Please connect your GitHub account.' }, { status: 403 })
    }

    // --- 3. Billing Check ---
    const billingCheck = await checkRepoLimit(userId)
    if (!billingCheck.allowed) {
      return NextResponse.json({ error: billingCheck.reason }, { status: 403 })
    }

    const { owner, repo } = parseGitHubUrl(repoUrl)
    const repoInfo = await getRepoInfo(owner, repo, githubToken)

    const currentPlan = billingCheck.plan as keyof typeof PLAN_LIMITS
    const canAccessPrivate = PLAN_LIMITS[currentPlan].allowPrivate

    if (repoInfo.private && !canAccessPrivate) {
        return NextResponse.json({ error: "Please upgrade to Pro for private repos." }, { status: 403 })
    }

    // --- 4. Database Insertion ---
    const existing = await db.select()
      .from(repos)
      .where(and(eq(repos.repoUrl, repoUrl), eq(repos.userId, userId)))
      .limit(1)

    let repoId: string
    const firstExisting = existing[0];

   if (firstExisting && firstExisting.isIndexed === 1) {
      return NextResponse.json({ success: true, repoId: firstExisting.id, alreadyIndexed: true })
    }

   if (firstExisting) {
      repoId = firstExisting.id
      await db.update(repos).set({ isIndexed: 0, isPrivate: repoInfo.private ? 1 : 0 }).where(eq(repos.id, repoId))
    }else {
      const inserted = await db.insert(repos).values({
        userId,
        repoUrl,
        repoName: repoInfo.name,
        owner,
        description: repoInfo.description || '',
        language: repoInfo.language || '',
        isIndexed: 0,
        isPrivate: repoInfo.private ? 1 : 0, 
      }).returning()
      const firstInserted = inserted[0]
      if (!firstInserted) throw new Error("Failed to insert repository") // Safe check
      repoId = firstInserted.id
    }

    // --- 5. FIRE BACKGROUND WORKER ---
    await inngest.send({
      name: "repo/index.requested",
      data: {
        repoId,
        owner,
        repoName: repoInfo.name,
        token: githubToken,
        branch
      },
    });

    return NextResponse.json({ 
      success: true, 
      repoId, 
      message: "Indexing started in the background" 
    });

  } catch (error) {
    console.error("Ingest Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}