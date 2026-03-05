/**
 * Embedding Generation for RAG
 */

import { createLLMProvider, type LLMConfig } from "../llm/provider";

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(
    texts: string[],
    config: LLMConfig
): Promise<number[][]> {
    const provider = createLLMProvider(config);

    try {
        return await provider.embed(texts);
    } catch (error) {
        console.error("Embedding generation error:", error);
        const detail =
            error instanceof Error ? error.message : "Unknown embedding error";
        throw new Error(`Failed to generate embeddings: ${detail}`);
    }
}

/**
 * Generate embedding for a single query
 */
export async function generateQueryEmbedding(
    query: string,
    config: LLMConfig
): Promise<number[]> {
    const embeddings = await generateEmbeddings([query], config);
    return embeddings[0];
}

/**
 * Batch embeddings with rate limiting
 */
export async function generateEmbeddingsBatch(
    texts: string[],
    config: LLMConfig,
    batchSize: number = 100
): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await generateEmbeddings(batch, config);
        results.push(...batchEmbeddings);

        // Small delay to avoid rate limits
        if (i + batchSize < texts.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    return results;
}
