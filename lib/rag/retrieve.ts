/**
 * Vector Retrieval for RAG
 */

import db from "../storage/localDb";
import { generateQueryEmbedding } from "./embed";
import type { LLMConfig } from "../llm/provider";

export interface ChunkWithScore {
    id: string;
    documentId: string;
    text: string;
    pageStart?: number;
    pageEnd?: number;
    chunkIndex: number;
    score: number;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (normA * normB);
}

/**
 * Retrieve top-K most relevant chunks for a query
 */
export async function retrieveTopK(
    query: string,
    docId: string,
    k: number,
    config: LLMConfig
): Promise<ChunkWithScore[]> {
    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query, config);

    // Get all chunks for this document
    const stmt = db.prepare(`
    SELECT id, document_id, text, page_start, page_end, chunk_index, embedding
    FROM chunks
    WHERE document_id = ? AND embedding IS NOT NULL
  `);

    const chunks = stmt.all(docId) as Array<{
        id: string;
        document_id: string;
        text: string;
        page_start: number | null;
        page_end: number | null;
        chunk_index: number;
        embedding: string;
    }>;

    // Calculate similarity scores
    const chunksWithScores: ChunkWithScore[] = chunks.map((chunk) => {
        const embedding = JSON.parse(chunk.embedding);
        const score = cosineSimilarity(queryEmbedding, embedding);

        return {
            id: chunk.id,
            documentId: chunk.document_id,
            text: chunk.text,
            pageStart: chunk.page_start || undefined,
            pageEnd: chunk.page_end || undefined,
            chunkIndex: chunk.chunk_index,
            score,
        };
    });

    // Sort by score (descending) and return top K
    return chunksWithScores.sort((a, b) => b.score - a.score).slice(0, k);
}

/**
 * Retrieve chunks with a minimum similarity threshold
 */
export async function retrieveWithThreshold(
    query: string,
    docId: string,
    threshold: number,
    config: LLMConfig
): Promise<ChunkWithScore[]> {
    const allChunks = await retrieveTopK(query, docId, 100, config);
    return allChunks.filter((chunk) => chunk.score >= threshold);
}

/**
 * Retrieve diverse chunks (avoid redundancy)
 */
export async function retrieveDiverse(
    query: string,
    docId: string,
    k: number,
    config: LLMConfig,
    diversityThreshold: number = 0.8
): Promise<ChunkWithScore[]> {
    const topChunks = await retrieveTopK(query, docId, k * 3, config);
    const selected: ChunkWithScore[] = [];

    for (const chunk of topChunks) {
        if (selected.length >= k) break;

        // Check if this chunk is too similar to already selected chunks
        let tooSimilar = false;

        for (const selectedChunk of selected) {
            // Simple diversity check: ensure chunks are not adjacent
            if (Math.abs(chunk.chunkIndex - selectedChunk.chunkIndex) <= 1) {
                tooSimilar = true;
                break;
            }
        }

        if (!tooSimilar) {
            selected.push(chunk);
        }
    }

    return selected;
}

/**
 * Format chunks for context in prompts
 */
export function formatChunksForContext(chunks: ChunkWithScore[]): string {
    return chunks
        .map((chunk, index) => {
            const pageInfo = chunk.pageStart
                ? ` (Page ${chunk.pageStart}${chunk.pageEnd !== chunk.pageStart ? `-${chunk.pageEnd}` : ""})`
                : "";
            return `[Source ${index + 1}${pageInfo}]\n${chunk.text}`;
        })
        .join("\n\n---\n\n");
}

/**
 * Get citations from chunks
 */
export function getCitations(chunks: ChunkWithScore[]): Array<{
    source: number;
    page?: number;
    score: number;
}> {
    return chunks.map((chunk, index) => ({
        source: index + 1,
        page: chunk.pageStart,
        score: chunk.score,
    }));
}
