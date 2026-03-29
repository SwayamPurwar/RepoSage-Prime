// app/api/demo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from "@google/genai"

// Initialize the new SDK (it automatically picks up GEMINI_API_KEY from env, 
// but we can pass it explicitly to be safe)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { feature, repoUrl, userInput } = await req.json()

    if (!feature || !repoUrl) {
      return NextResponse.json({ error: 'Feature and Repository URL are required.' }, { status: 400 })
    }

    let prompt = ""

    // Create dynamic prompts based on the selected feature
    switch (feature) {
      case 'chat':
        prompt = `You are an AI assistant simulating a codebase chat for a demo. The user is asking about a repository located at ${repoUrl}. 
        User's question: "${userInput}"
        Respond informatively and professionally, acting as if you have analyzed the repository. Keep it concise. Add a note at the end that this is a simulated demo.`
        break;
      
      case 'review':
        prompt = `You are a senior code reviewer analyzing a PR snippet for ${repoUrl}.
        Code Snippet:
        ${userInput}
        
        Provide a structured, professional code review. Point out 1 potential improvement or bug, and suggest a fix. Format it nicely with markdown.`
        break;

      case 'bug':
        prompt = `You are a security and bug detection AI analyzing code for ${repoUrl}.
        Code Snippet:
        ${userInput}
        
        Act as if you found a logical bug or vulnerability. Explain the risk, severity, and provide a secure, refactored version of the code snippet.`
        break;

      case 'onboarding':
        prompt = `Generate a comprehensive but concise Markdown onboarding guide for a new developer joining the project at ${repoUrl}. 
        Include sections for: Project Overview, Prerequisites, Local Setup steps, and Architecture conventions. Assume standard modern web development practices based on the URL.`
        break;

      case 'readme':
        prompt = `Write a professional, impressive README.md file for the repository at ${repoUrl}. 
        Include: A catchy title, Badges, Features list, Installation, Usage, and Contributing sections. Make it look like a top-tier open-source project.`
        break;

      default:
        return NextResponse.json({ error: 'Invalid feature selected.' }, { status: 400 })
    }

    // Use the new SDK syntax and model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Highly recommended for coding tasks over 1.5
      contents: prompt,
    })

    // Note: In the new SDK, .text is a property, not a function!
    return NextResponse.json({ result: response.text })

  } catch (error) {
    console.error('Demo API error:', error)
    return NextResponse.json(
      { error: 'Failed to run AI simulation. Please try again.' },
      { status: 500 }
    )
  }
}