export async function generateEmbedding(
  text: string
): Promise<number[]> {
  const response = await fetch(
    'https://api-atlas.nomic.ai/v1/embedding/text',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NOMIC_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'nomic-embed-text-v1.5',
        texts: [text],
        task_type: 'search_document',
      }),
    }
  )

  if (!response.ok) {
    const err = (await response.json()) as unknown
    throw new Error(`Nomic embedding error: ${JSON.stringify(err)}`)
  }

  const data = (await response.json()) as { embeddings: number[][] }
  return data.embeddings[0]
}

export function chunkText( 
  text: string, 
  chunkSize = 500 
): string[] { 
  const lines = text.split('\n') 
  const chunks: string[] = [] 
  let current = '' 
  
  for (const line of lines) { 
    if ( 
      (current + line).length > chunkSize &&  
      current.length > 0 
    ) { 
      chunks.push(current.trim()) 
      current = '' 
    } 
    current += line + '\n' 
  } 
  
  if (current.trim()) chunks.push(current.trim()) 
  return chunks 
} 
