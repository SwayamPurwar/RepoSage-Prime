import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { chats, users, apiKeys, usageLogs, repos } from '@/lib/schema'
import { chatWithCodebase } from '@/lib/groq'
import { generateEmbedding } from '@/lib/embeddings'
import { neon } from '@neondatabase/serverless'
import { eq, and } from 'drizzle-orm'
import { redis } from '@/lib/redis'
import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod' // <-- NEW: Import Zod for request validation
import crypto from 'crypto';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- REQUEST VALIDATION SCHEMA ---
const chatRequestSchema = z.object({
  repoId: z.string().uuid("Invalid Repository ID"),
  repoName: z.string().optional().default('Repository'),
  question: z.string().min(2, "Question is too short").max(2000, "Question is too long"), // Prevent massive payload attacks
  preferredModel: z.string().optional().default('llama-3.3-70b-versatile'),
  branch: z.string().optional().default('main'),
})

type SimilarChunkRow = {
  content: string
  file_path: string
  similarity: number
}
async function getAuthenticatedUserId(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const rawKey = authHeader.split(" ")[1];
    if (!rawKey) return null; 
    
    // Hash the incoming raw key to match what is in the database
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    const [validKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, hashedKey))
      .limit(1);
    
    if (validKey) return validKey.userId;
  }

  const session = await auth();
  return session.userId ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    const [userRecord] = await db.select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    const userPlan = userRecord?.plan || 'hobby';

    const { getAiRateLimiter } = await import('@/lib/ratelimit'); // Make sure to update your imports at the top if you prefer!
    const rateLimiter = getAiRateLimiter(userPlan);

    const { success, limit, reset, remaining } = await rateLimiter.limit(userId)
    if (!success) {
      return NextResponse.json({ 
        error: `Rate limit exceeded for ${userPlan} plan. Please upgrade or try again later.` 
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    }

    // --- 2. ZOD INPUT VALIDATION ---
    const rawBody = await req.json()
    const parseResult = chatRequestSchema.safeParse(rawBody)
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parseResult.error.format() }, 
        { status: 400 }
      )
    }

    const { repoId, repoName, question, preferredModel, branch } = parseResult.data

    const [repoAuth] = await db.select()
      .from(repos)
      .where(and(eq(repos.id, repoId), eq(repos.userId, userId)))
      .limit(1);

    if (!repoAuth) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this repository.' }, 
        { status: 403 }
      )
    }

    // --- 3. SEMANTIC CACHING LAYER ---
    const normalizedQuestion = question.trim().toLowerCase()
    const cacheKey = `chat:${repoId}:${branch}:${preferredModel}:${normalizedQuestion}`
    const cachedData = await redis.get(cacheKey)

    if (cachedData) {
      const { answer, sources } = cachedData as { answer: string, sources: string[] }

      // Log the chat for UI history
      await db.insert(chats).values({
        repoId,
        userId,
        question,
        answer,
        model: preferredModel,
      })

      return NextResponse.json({ answer, sources, isCached: true })
    }

    // --- 4. VECTOR SEARCH ---
    const sql = neon(process.env.DATABASE_URL!)
    const questionEmbedding = await generateEmbedding(question)
    const vectorStr = `[${questionEmbedding.join(',')}]`

    const rows = await sql`
      SELECT content, file_path,
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM embeddings
      WHERE repo_id = ${repoId}::uuid AND branch = ${branch}
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT 8
    `
    const similarChunks = rows as unknown as SimilarChunkRow[]

    if (similarChunks.length === 0) {
      return NextResponse.json({ 
        answer: 'No relevant code context found. Make sure the repository is fully indexed.',
        sources: [],
        isCached: false
      })
    }

    // --- 5. AI GENERATION ---
   // --- 5. AI GENERATION (STREAMING) ---
    const contextChunks = similarChunks.map((chunk) => `File: ${chunk.file_path}\n\n${chunk.content}`)
    const sources = [...new Set(similarChunks.map((c) => c.file_path))] 

    // Construct the system prompt with your retrieved context
    const systemPrompt = `You are an expert coding assistant for the repository ${repoName}. 
    Use the following code context to answer the user's question.
    
    Context:
    ${contextChunks.join('\n\n')}`;

    // Use streamText instead of chatWithCodebase
    const result = streamText({
      model: groq(preferredModel),
      system: systemPrompt,
      prompt: question,
      
      // --- NEW: 6. ASYNC BACKGROUND TASKS ---
      // This runs after the stream completes successfully
      async onFinish({ text, usage }) {
        try {
          // Wrap in a transaction as we configured in Step 5
          await db.transaction(async (tx) => {
            await tx.insert(chats).values({
              repoId,
              userId,
              question,
              answer: text, // The fully generated text
              model: preferredModel,
            });

            await tx.insert(usageLogs).values({
              userId,
              actionType: 'agent',
              // Now you actually have token usage data!
              tokensUsed: usage.totalTokens, 
            });
          });

          // Update cache
          await redis.setex(cacheKey, 86400, { answer: text, sources });
        } catch (dbError) {
          console.error('[BACKGROUND_TASK_ERROR]:', dbError);
        }
      }
    });

    // Return the stream directly to the client alongside the sources metadata
   return result.toTextStreamResponse({
      headers: {
        'x-sources': JSON.stringify(sources),
        'x-iscached': 'false'
      }
    });
    

  } catch (error) {
    console.error('[CHAT_API_ERROR]:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    )
  }
}


// Get chat history for a repo
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const repoId = searchParams.get('repoId')

  if (!repoId) {
    return NextResponse.json({ error: 'repoId required' }, { status: 400 })
  }

  try {
    // 1. Fetch chat history
    const history = await db.select()
      .from(chats)
      .where(eq(chats.repoId, repoId))
      .orderBy(chats.createdAt)
      .limit(50)

    // 2. Fetch user plan
    const userRecords = await db.select()
      .from(users)
      .where(eq(users.id, userId))
    
    const plan = userRecords[0]?.plan || 'hobby'

    return NextResponse.json({ history, plan })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load chat history' },
      { status: 500 }
    )
  }
}