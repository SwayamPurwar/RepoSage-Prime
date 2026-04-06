import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiKeys, usageLogs } from '@/lib/schema'
import crypto from 'crypto'
import Groq from 'groq-sdk'
import { z } from 'zod'
import { redis } from '@/lib/redis'
import { getAiRateLimiter } from '@/lib/ratelimit'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Strict validation for the agent payload
const agentRequestSchema = z.object({
  prompt: z.string().min(5, "Task is too short").max(2000, "Task description too long"),
  currentFiles: z.array(z.object({
    filePath: z.string(),
    code: z.string() // FIXED: Changed from 'content' to 'code' to match VS Code extension
  })).max(10, "You can only pass up to 10 files for context at a time"), 
})

export async function POST(req: NextRequest) {
  try {
    // --- 1. AUTHENTICATION ---
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 })
    }

    const providedKey = authHeader.split(" ")[1]
    
    // Type-safety check for crypto
    if (!providedKey) {
      return NextResponse.json({ error: "Malformed Authorization header" }, { status: 401 })
    }

    let validUserId: string | null = null

    // --- 2. API KEY CACHING LAYER ---
    const cacheKey = `apikey:${providedKey}`
    const cachedUserId = await redis.get<string>(cacheKey)

    if (cachedUserId) {
      validUserId = cachedUserId
    } else {
      // Hash the incoming raw key to match what is stored in the DB
      const hashedProvidedKey = crypto.createHash("sha256").update(providedKey).digest("hex")

      const allKeys = await db.select().from(apiKeys)
      for (const record of allKeys) {
        if (record.key === hashedProvidedKey) {
          validUserId = record.userId
          await redis.setex(cacheKey, 86400, record.userId) // Cache for 24h
          break
        }
      }
    }

    if (!validUserId) return NextResponse.json({ error: "Invalid API key." }, { status: 401 })

    // --- 3. AI RATE LIMITING ---
    // Use validUserId instead of Clerk's auth() since VS Code has no cookies
    const rateLimiter = getAiRateLimiter('hobby'); 
    const { success, limit, reset, remaining } = await rateLimiter.limit(validUserId)
    
    if (!success) {
      return NextResponse.json({ error: 'Agent rate limit exceeded. Please wait.' }, { status: 429 })
    }

    // --- 4. PAYLOAD VALIDATION ---
    const rawBody = await req.json()
    const parseResult = agentRequestSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 })
    }

    const { prompt, currentFiles } = parseResult.data

    // --- 5. ASYNC USAGE LOGGING ---
    db.insert(usageLogs).values({
      userId: validUserId,
      actionType: 'agent',
      tokensUsed: Math.ceil(JSON.stringify(currentFiles).length / 4) + Math.ceil(prompt.length / 4),
    }).catch(err => console.error("[USAGE_LOG_ERROR]:", err))

    // --- 6. AGENT EXECUTION ---
    const systemPrompt = `
You are an autonomous senior developer. 
The user will give you a task. You must return a JSON object containing an array of 'operations'.
Valid action types are: "UPDATE" (replace file content) or "CREATE" (make a new file).

Respond STRICTLY with valid JSON in this exact format:
{
  "operations": [
    {
      "action": "UPDATE",
      "filePath": "src/components/Button.tsx",
      "code": "// new code here..."
    }
  ]
}`

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Current codebase context:\n${JSON.stringify(currentFiles)}` },
        { role: "user", content: `Task: ${prompt}` }
      ],
      model: "llama-3.3-70b-versatile", 
      response_format: { type: "json_object" }, 
      temperature: 0.1, 
    })

    const content = completion.choices[0]?.message?.content;
    const agentPlan = JSON.parse(content || '{"operations": []}');
    return NextResponse.json(agentPlan)

  } catch (error) {
    console.error('[AGENT_API_ERROR]:', error)
    return NextResponse.json({ error: 'Agent failed to process request' }, { status: 500 })
  }
}