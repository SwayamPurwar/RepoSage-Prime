import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiKeys, usageLogs } from '@/lib/schema'
import { decryptApiKey } from '@/lib/encryption'
import Groq from 'groq-sdk'
import { z } from 'zod'
import { getAiRateLimiter } from '@/lib/ratelimit'
import { redis } from '@/lib/redis' // Use Upstash Redis for caching
import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// --- STRICT INPUT VALIDATION ---
const refactorRequestSchema = z.object({
  codeContent: z.string().min(1, "Code content is required").max(50000, "Code payload too large"),
  code: z.string().optional(), // Fallback
  filePath: z.string().optional().default('unknown.ts'),
  issueDescription: z.string().optional().default('Improve and optimize this code.'),
})

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }
    
    const providedKey = authHeader.split(" ")[1];
    
    // ADD THIS CHECK: Tell TypeScript it's definitely a string
    if (!providedKey) {
      return NextResponse.json({ error: "Malformed Authorization header" }, { status: 401 });
    }

    let validUserId: string | null = null;

    // --- 2. API KEY CACHING LAYER (Huge Performance Boost) ---
    // Instead of doing O(N) database decryptions every time, we check Redis first.
    const cacheKey = `apikey:${providedKey}`;
    const cachedUserId = await redis.get<string>(cacheKey);
if (cachedUserId) {
      validUserId = cachedUserId;
    } else {
      // Hash the incoming raw key to match what is stored in the DB
      const hashedProvidedKey = crypto.createHash("sha256").update(providedKey).digest("hex");

      const allKeys = await db.select().from(apiKeys);
      for (const record of allKeys) {
        if (record.key === hashedProvidedKey) {
          validUserId = record.userId;
          // Cache the valid key-to-user mapping in Redis for 24 hours
          await redis.setex(cacheKey, 86400, record.userId);
          break; 
        }
      }
    }

    if (!validUserId) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    }

    const rateLimiter = getAiRateLimiter('hobby');
    const { success, limit, reset, remaining } = await rateLimiter.limit(validUserId);
    
    if (!success) {
      return new NextResponse('Rate limit exceeded. Please wait a few seconds.', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    }
    // --- 4. PAYLOAD VALIDATION ---
    const rawBody = await req.json();
    const parseResult = refactorRequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 });
    }

    const { filePath, issueDescription } = parseResult.data;
    const finalCode = parseResult.data.codeContent || parseResult.data.code || '';

    // --- 5. USAGE LOGGING (Non-blocking) ---
    // We don't await this so it doesn't slow down the start of the stream
    const ext = filePath.split('.').pop() || 'unknown';
    const estimatedTokens = Math.ceil(finalCode.length / 4); 
    
    db.insert(usageLogs).values({
      userId: validUserId,
      actionType: 'refactor',
      tokensUsed: estimatedTokens,
      language: ext
    }).catch(err => console.error("[USAGE_LOG_ERROR]:", err));

    // --- 6. AI STREAMING SETUP ---
    const systemPrompt = `You are an expert developer refactoring code. 
IMPORTANT: Respond ONLY with the raw code. Do NOT wrap the code in markdown blocks like \`\`\`typescript. Do NOT provide explanations. Just the raw code.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Refactor this code. Task: ${issueDescription}\n\nCode:\n${finalCode}` }
      ],
      model: "llama-3.1-8b-instant", 
      stream: true, 
      temperature: 0.2, // Lower temp for code refactoring keeps it predictable
    });

    // --- 7. SAFE STREAMING RESPONSE ---
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
        } catch (streamError) {
          console.error("Stream generation error:", streamError);
          controller.enqueue(new TextEncoder().encode("\n// [Error: Connection to AI interrupted]"));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache', // Prevent the browser/client from caching the stream
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('[REFACTOR_API_ERROR]:', error);
    return NextResponse.json({ error: 'Failed to process refactoring request' }, { status: 500 });
  }
}