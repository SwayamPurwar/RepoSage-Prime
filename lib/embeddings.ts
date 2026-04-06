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
  const firstEmbedding = data.embeddings[0];
  if (!firstEmbedding) throw new Error("No embedding returned");
  return firstEmbedding;
}

export function chunkText(
  text: string,
  maxChunkSize = 800 // Increased slightly since code chunks better when larger
): string[] {
  const chunks: string[] = []
  
  // 1. First, try to split by logical blocks (double newlines often separate functions/classes)
  const blocks = text.split('\n\n')
  
  let currentChunk = ''
  
  for (const block of blocks) {
    // If adding the next block exceeds our limit, push the current chunk
    if ((currentChunk + block).length > maxChunkSize && currentChunk.length > 0) {
      // If a single block is somehow massive (e.g., a massive JSON or array), 
      // we need to fall back to splitting it by single newlines
      if (currentChunk.trim()) chunks.push(currentChunk.trim())
      currentChunk = ''
      
      // Handle the massive block by breaking it down by single newlines
      if (block.length > maxChunkSize) {
        const lines = block.split('\n')
        let tempChunk = ''
        for (const line of lines) {
          if ((tempChunk + line).length > maxChunkSize && tempChunk.length > 0) {
            chunks.push(tempChunk.trim())
            tempChunk = ''
          }
          tempChunk += line + '\n'
        }
        if (tempChunk.trim()) chunks.push(tempChunk.trim())
        continue // Move to the next block
      }
    }
    
    currentChunk += block + '\n\n'
  }
  
  if (currentChunk.trim()) chunks.push(currentChunk.trim())
  
  return chunks
}