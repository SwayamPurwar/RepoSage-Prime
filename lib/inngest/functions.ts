import { inngest } from "./client";
import { db } from "@/lib/db";
import { repos, embeddings } from "@/lib/schema";
import { getRepoFiles } from "@/lib/github";
import { chunkText, generateEmbedding } from "@/lib/embeddings";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";

// Utility to redact secrets before embedding
function redactSecrets(text: string): string {
  let safeText = text;
  safeText = safeText.replace(/(sk-[a-zA-Z0-9]{20,})/g, "[REDACTED_SECRET_KEY]");
  safeText = safeText.replace(/(ghp_[a-zA-Z0-9]{36})/g, "[REDACTED_GITHUB_TOKEN]");
  safeText = safeText.replace(/(AKIA[0-9A-Z]{16})/g, "[REDACTED_AWS_KEY]");
  safeText = safeText.replace(/Bearer\s+([a-zA-Z0-9\-._~+/]+=*)/g, "Bearer [REDACTED_TOKEN]");
  return safeText;
}

export const indexRepository = inngest.createFunction(
  { 
    id: "index-repository", 
    retries: 3, // Will retry 3 times automatically on failure
    onFailure: async ({ event, error }) => {
      // CRITICAL: If all retries fail, mark the repo as failed in the DB
      // Assuming isIndexed: -1 means "Failed"
      const { repoId } = event.data.event.data;
      console.error(`[INDEX_FAILED] Repo: ${repoId} - ${error.message}`);
      await db.update(repos)
        .set({ isIndexed: -1 }) 
        .where(eq(repos.id, repoId));
    }
  },
  async ({ event, step }) => {
  // Explicitly tell TypeScript the shape of our event data
    const { repoId, owner, repoName, token, branch } = event.data as {
      repoId: string;
      owner: string;
      repoName: string;
      token: string;
      branch: string;
    };

    // Step 1: Fetch files securely from GitHub
    const files = await step.run("fetch-github-files", async () => {
      return await getRepoFiles(owner, repoName, token, branch);
    });

    if (!files || files.length === 0) {
      throw new Error("No readable code files found.");
    }

    // Step 2: Delete old embeddings using Drizzle
    await step.run("clear-old-embeddings", async () => {
      await db.delete(embeddings).where(
        and(eq(embeddings.repoId, repoId), eq(embeddings.branch, branch))
      );
    });

    // Step 3: Process, redact, and embed files
    await step.run("generate-and-store-embeddings", async () => {
      const sql = neon(process.env.DATABASE_URL!);
      
      for (const file of files) {
        const safeContent = redactSecrets(file.content);
        const chunks = chunkText(safeContent, 800); 
        
        const BATCH_SIZE = 5;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batchChunks = chunks.slice(i, i + BATCH_SIZE);
          
          const embeddingsBatch = await Promise.all(
            batchChunks.map((chunk) =>
              generateEmbedding(`File: ${file.path}\n\n${chunk}`).catch((e) => {
                console.error(`Embedding failed for ${file.path}`, e);
                return null;
              })
            )
          );

          const insertPromises = [];
          for (let j = 0; j < batchChunks.length; j++) {
            const chunk = batchChunks[j];
            const embedding = embeddingsBatch[j];
          if (!chunk || !chunk.trim() || !embedding) continue;

            // We must use raw SQL here specifically for the `::vector` typecast for pgvector
            const vectorStr = `[${embedding.join(",")}]`;
            insertPromises.push(
              sql`
                INSERT INTO embeddings 
                (repo_id, branch, file_path, chunk_index, content, embedding)
                VALUES (${repoId}::uuid, ${branch}, ${file.path}, ${i + j}, ${chunk}, ${vectorStr}::vector)
              `
            );
          }
          
          if (insertPromises.length > 0) await Promise.all(insertPromises);
        }
      }
    });

    // Step 4: Mark as fully indexed (isIndexed: 1)
    await step.run("mark-repo-indexed", async () => {
      await db.update(repos)
        .set({ isIndexed: 1, totalFiles: files.length })
        .where(eq(repos.id, repoId));
    });

    return { success: true, filesProcessed: files.length };
  }
);