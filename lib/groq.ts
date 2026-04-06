// lib/groq.ts
import Groq from 'groq-sdk'
import OpenAI from 'openai'
import { GoogleGenAI } from "@google/genai"
import { Langfuse } from 'langfuse'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// --- INITIALIZE LANGFUSE OBSERVABILITY ---
const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_HOST || "https://us.cloud.langfuse.com"
})

export async function chatWithCodebase(
  question: string,
  contextChunks: string[],
  repoName: string,
  userId: string, // <-- Added to track which user is asking
  modelChoice: string = 'llama-3.3-70b-versatile'
) {
  const context = contextChunks.join('\n\n---\n\n')

  // 1. Start a Langfuse Trace for this specific user interaction
  const trace = langfuse.trace({
    name: "chat-with-codebase",
    userId: userId,
    metadata: { repoName, modelChoice }
  })

  // 2. Log the pgvector retrieval step
  trace.span({
    name: "pgvector-retrieval",
    input: question,
    output: contextChunks,
  })

  const systemPrompt = `You are an expert developer for "${repoName}".`
  const userPrompt = `CODE CONTEXT:\n${context}\n\nQUESTION: ${question}`

  // 3. Start the LLM Generation span
  const generation = trace.generation({
    name: `${modelChoice}-completion`,
    model: modelChoice,
   input: userPrompt
  })

  try {
    let answer = '';

    // Route to Gemini
    if (modelChoice === 'gemini-1.5-pro') {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: `CONTEXT:\n${context}\n\nQUESTION: ${question}`,
      })
      answer = response.text || '';
    } 
    // Route to OpenAI
    else if (modelChoice === 'gpt-4o' || modelChoice === 'gpt-4o-mini') {
      const completion = await openai.chat.completions.create({
        model: modelChoice,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })
    answer = completion.choices[0]?.message?.content || '';
    }
    // Default Fallback: Free Groq (Llama 3.3)
    else {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1024,
      })
    answer = completion.choices[0]?.message?.content || '';
    }

    // 4. Log the successful answer
    generation.end({
      output: answer,
    })

    return answer

  } catch (error) {
    // 5. Catch and log any API failures (e.g., rate limits)
    generation.end({ level: "ERROR", statusMessage: String(error) })
    throw error
  } finally {
    // Ensure the trace is sent to the dashboard before the serverless function exits
    await langfuse.flushAsync()
  }
}

// --- ADDING MISSING EXPORTS ---

export async function reviewCode(codeSnippet: string, context: string, plan: string) {
  const prompt = `As a Senior Software Engineer, review this code snippet within the provided codebase context.
  CODE SNIPPET: ${codeSnippet}
  CONTEXT: ${context}
  
  Provide a professional review focusing on security vulnerabilities, logical bugs, and performance.`

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  })
  return response.text
}

export async function analyzeCodeHealth(files: {path: string, content: string}[], plan: string) {
  const context = files.map(f => `File: ${f.path}\n${f.content.substring(0, 1000)}`).join('\n\n')
  const prompt = `Analyze the health of this codebase and provide scores (0-100) for Complexity, Bug Risk, and Documentation.
  Return ONLY a valid JSON object in this format:
  { "complexity": 85, "bugs": 10, "documentation": 90, "summary": "Codebase is well-structured..." }
  
  CODEBASE: ${context}`

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  })
  return response.text
  
}

export async function generateTest(filePath: string, code: string, context: string) {
  const prompt = `
    You are an expert Software Engineer in Test. 
    Write a complete, production-ready unit test suite for the following file: \`${filePath}\`.
    
    CRITICAL INSTRUCTIONS:
    1. Use a modern testing framework (Jest or Vitest for JS/TS, PyTest for Python, etc.).
    2. Include imports, setup, and teardown if necessary.
    3. Mock external dependencies. Use the provided context to understand how dependencies are structured.
    4. Test both "happy paths" and edge cases.
    5. Output ONLY the raw code block for the test file. Do not include markdown formatting like \`\`\`typescript, just the raw code.
    
    FILE TO TEST:
    ${code}
    
    DEPENDENCY CONTEXT:
    ${context}
  `;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: 'system', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2, 
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

export async function generateTestCode(filePath: string, code: string, context: string) {
  const prompt = `
    You are an elite Software Engineer in Test. 
    Write a complete, production-ready unit test suite for the following file: \`${filePath}\`.
    
    CRITICAL INSTRUCTIONS:
    1. Use a modern testing framework standard for the file's language (e.g., Jest/Vitest for TS/JS, PyTest for Python).
    2. Include necessary imports, setup, and teardown logic.
    3. Mock external dependencies intelligently. Use the provided "DEPENDENCY CONTEXT" to understand how imported functions behave.
    4. Test both the "happy path" and potential edge cases (e.g., null values, failed API calls).
    5. Output ONLY the raw code for the test file. Do not include markdown formatting or explanations.
    
    FILE TO TEST:
    ${code}
    
    DEPENDENCY CONTEXT:
    ${context}
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: 'system', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1, 
  });

  return response.choices[0]?.message?.content || '';
}

export async function refactorCodeSnippet(filePath: string, code: string, issue?: string) {
  const issueContext = issue ? `Specifically focus on fixing this issue: ${issue}` : 'Optimize for readability, performance, and modern best practices.';
  
  const prompt = `
    You are an elite Staff Software Engineer. 
    Refactor the following code snippet from \`${filePath || 'a file'}\`.
    
    ${issueContext}
    
    CRITICAL INSTRUCTIONS:
    1. Maintain the exact same functional behavior and return types.
    2. Add inline comments explaining complex logic.
    3. Output ONLY the refactored code block. Do not wrap it in markdown and do not provide explanations before or after the code.
    
    CODE TO REFACTOR:
    ${code}
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: 'system', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2, 
  });

  return response.choices[0]?.message?.content || '';
}