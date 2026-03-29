// lib/groq.ts
import Groq from 'groq-sdk'
import OpenAI from 'openai'
import { GoogleGenAI } from "@google/genai"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function chatWithCodebase(
  question: string,
  contextChunks: string[],
  repoName: string,
  plan: string = 'hobby',
  modelChoice: string = 'gpt-4o' 
) {
  const context = contextChunks.join('\n\n---\n\n')

  if (plan === 'hobby') {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You are an expert developer for "${repoName}".` },
        { role: 'user', content: `CODE CONTEXT:\n${context}\n\nQUESTION: ${question}` },
      ],
      max_tokens: 1024,
    })
    return completion.choices[0].message.content || ''
  }

  // Pro users: Route to Gemini Flash using the new SDK
  if (modelChoice === 'gemini-1.5-pro') {
    const prompt = `CONTEXT:\n${context}\n\nQUESTION: ${question}`
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
    })
    return response.text
  } 
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: `You are an elite software architect studying "${repoName}".` },
      { role: 'user', content: `CODE CONTEXT:\n${context}\n\nQUESTION: ${question}` },
    ],
  })
  return completion.choices[0].message.content || ''
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