/**
 * Text Chunking for RAG
 * Splits text into overlapping chunks for better context retrieval
 */

export interface Chunk {
    id: string;
    text: string;
    startIndex: number;
    endIndex: number;
    pageStart?: number;
    pageEnd?: number;
}

export interface ChunkOptions {
    chunkSize: number; // Target size in tokens
    overlap: number; // Overlap in tokens
    preserveParagraphs?: boolean; // Try to keep paragraphs intact
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Convert tokens to approximate character count
 */
function tokensToChars(tokens: number): number {
    return tokens * 4;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
    // Simple sentence splitting (can be improved with NLP library)
    return text
        .split(/([.!?]+\s+)/)
        .reduce((acc: string[], curr, i, arr) => {
            if (i % 2 === 0) {
                const sentence = curr + (arr[i + 1] || "");
                if (sentence.trim()) acc.push(sentence.trim());
            }
            return acc;
        }, []);
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
    return text
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
}

/**
 * Chunk text with overlap
 */
export function chunkText(text: string, options: ChunkOptions): Chunk[] {
    const { chunkSize, overlap, preserveParagraphs = true } = options;

    const chunks: Chunk[] = [];
    const chunkSizeChars = tokensToChars(chunkSize);
    const overlapChars = tokensToChars(overlap);

    if (preserveParagraphs) {
        // Try to chunk by paragraphs first
        const paragraphs = splitIntoParagraphs(text);
        let currentChunk = "";
        let startIndex = 0;

        for (const paragraph of paragraphs) {
            const potentialChunk = currentChunk + (currentChunk ? "\n\n" : "") + paragraph;

            if (estimateTokens(potentialChunk) > chunkSize && currentChunk) {
                // Save current chunk
                chunks.push({
                    id: `chunk-${chunks.length}`,
                    text: currentChunk,
                    startIndex,
                    endIndex: startIndex + currentChunk.length,
                });

                // Start new chunk with overlap
                const sentences = splitIntoSentences(currentChunk);
                let overlapText = "";
                let overlapTokens = 0;

                for (let i = sentences.length - 1; i >= 0; i--) {
                    const sentence = sentences[i];
                    const tokens = estimateTokens(sentence);

                    if (overlapTokens + tokens <= overlap) {
                        overlapText = sentence + " " + overlapText;
                        overlapTokens += tokens;
                    } else {
                        break;
                    }
                }

                startIndex += currentChunk.length - overlapText.length;
                currentChunk = overlapText + paragraph;
            } else {
                currentChunk = potentialChunk;
            }
        }

        // Add final chunk
        if (currentChunk) {
            chunks.push({
                id: `chunk-${chunks.length}`,
                text: currentChunk,
                startIndex,
                endIndex: startIndex + currentChunk.length,
            });
        }
    } else {
        // Simple character-based chunking
        let position = 0;

        while (position < text.length) {
            const end = Math.min(position + chunkSizeChars, text.length);
            const chunkText = text.slice(position, end);

            chunks.push({
                id: `chunk-${chunks.length}`,
                text: chunkText,
                startIndex: position,
                endIndex: end,
            });

            position += chunkSizeChars - overlapChars;
        }
    }

    return chunks;
}

/**
 * Chunk text with page information (for PDFs)
 */
export function chunkTextWithPages(
    pages: Array<{ pageNumber: number; text: string }>,
    options: ChunkOptions
): Chunk[] {
    const chunks: Chunk[] = [];
    const { chunkSize, overlap } = options;

    let currentChunk = "";
    let currentPageStart = 1;
    let currentPageEnd = 1;
    let startIndex = 0;

    for (const page of pages) {
        const sentences = splitIntoSentences(page.text);

        for (const sentence of sentences) {
            const potentialChunk = currentChunk + (currentChunk ? " " : "") + sentence;

            if (estimateTokens(potentialChunk) > chunkSize && currentChunk) {
                // Save current chunk
                chunks.push({
                    id: `chunk-${chunks.length}`,
                    text: currentChunk,
                    startIndex,
                    endIndex: startIndex + currentChunk.length,
                    pageStart: currentPageStart,
                    pageEnd: currentPageEnd,
                });

                // Calculate overlap
                const chunkSentences = splitIntoSentences(currentChunk);
                let overlapText = "";
                let overlapTokens = 0;

                for (let i = chunkSentences.length - 1; i >= 0; i--) {
                    const s = chunkSentences[i];
                    const tokens = estimateTokens(s);

                    if (overlapTokens + tokens <= overlap) {
                        overlapText = s + " " + overlapText;
                        overlapTokens += tokens;
                    } else {
                        break;
                    }
                }

                startIndex += currentChunk.length - overlapText.length;
                currentChunk = overlapText + sentence;
                currentPageStart = page.pageNumber;
            } else {
                currentChunk = potentialChunk;
            }

            currentPageEnd = page.pageNumber;
        }
    }

    // Add final chunk
    if (currentChunk) {
        chunks.push({
            id: `chunk-${chunks.length}`,
            text: currentChunk,
            startIndex,
            endIndex: startIndex + currentChunk.length,
            pageStart: currentPageStart,
            pageEnd: currentPageEnd,
        });
    }

    return chunks;
}
