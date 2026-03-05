import db from "./localDb";
import { generateId } from "../utils";

export interface Document {
    id: string;
    title: string;
    sourceType: "pdf" | "text";
    sourcePath?: string;
    pagesCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Chunk {
    id: string;
    documentId: string;
    text: string;
    pageStart?: number;
    pageEnd?: number;
    chunkIndex: number;
    embedding?: number[];
    createdAt: string;
}

/**
 * Create a new document
 */
export function createDocument(
    title: string,
    sourceType: "pdf" | "text",
    sourcePath?: string,
    pagesCount?: number
): Document {
    const id = generateId();

    const stmt = db.prepare(`
    INSERT INTO documents (id, title, source_type, source_path, pages_count)
    VALUES (?, ?, ?, ?, ?)
  `);

    stmt.run(id, title, sourceType, sourcePath, pagesCount);

    return getDocument(id)!;
}

/**
 * Get a document by ID
 */
export function getDocument(id: string): Document | null {
    const stmt = db.prepare("SELECT * FROM documents WHERE id = ?");
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
        id: row.id,
        title: row.title,
        sourceType: row.source_type,
        sourcePath: row.source_path,
        pagesCount: row.pages_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Get all documents (most recent first)
 */
export function getAllDocuments(): Document[] {
    const stmt = db.prepare("SELECT * FROM documents ORDER BY created_at DESC");
    const rows = stmt.all() as any[];

    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        sourceType: row.source_type,
        sourcePath: row.source_path,
        pagesCount: row.pages_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

/**
 * Delete a document and all related data
 */
export function deleteDocument(id: string): void {
    const stmt = db.prepare("DELETE FROM documents WHERE id = ?");
    stmt.run(id);
}

/**
 * Create chunks for a document
 */
export function createChunks(chunks: Omit<Chunk, "id" | "createdAt">[]): void {
    const stmt = db.prepare(`
    INSERT INTO chunks (id, document_id, text, page_start, page_end, chunk_index, embedding)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    const insertMany = db.transaction((chunksToInsert: typeof chunks) => {
        for (const chunk of chunksToInsert) {
            const id = generateId();
            const embeddingJson = chunk.embedding ? JSON.stringify(chunk.embedding) : null;
            stmt.run(
                id,
                chunk.documentId,
                chunk.text,
                chunk.pageStart,
                chunk.pageEnd,
                chunk.chunkIndex,
                embeddingJson
            );
        }
    });

    insertMany(chunks);
}

/**
 * Create a single chunk for a document
 */
export function createChunk(
    documentId: string,
    text: string,
    pageStart: number | undefined,
    pageEnd: number | undefined,
    chunkIndex: number
): void {
    createChunks([
        {
            documentId,
            text,
            pageStart,
            pageEnd,
            chunkIndex,
        },
    ]);
}

/**
 * Get all chunks for a document
 */
export function getChunks(documentId: string): Chunk[] {
    const stmt = db.prepare("SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index");
    const rows = stmt.all(documentId) as any[];

    return rows.map((row) => ({
        id: row.id,
        documentId: row.document_id,
        text: row.text,
        pageStart: row.page_start,
        pageEnd: row.page_end,
        chunkIndex: row.chunk_index,
        embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
        createdAt: row.created_at,
    }));
}

/**
 * Update chunk embeddings
 */
export function updateChunkEmbedding(chunkId: string, embedding: number[]): void;
export function updateChunkEmbedding(
    documentId: string,
    chunkIndex: number,
    embedding: number[]
): void;
export function updateChunkEmbedding(
    chunkIdOrDocumentId: string,
    chunkIndexOrEmbedding: number | number[],
    embeddingMaybe?: number[]
): void {
    if (Array.isArray(chunkIndexOrEmbedding)) {
        const stmt = db.prepare("UPDATE chunks SET embedding = ? WHERE id = ?");
        stmt.run(JSON.stringify(chunkIndexOrEmbedding), chunkIdOrDocumentId);
        return;
    }

    const stmt = db.prepare(
        "UPDATE chunks SET embedding = ? WHERE document_id = ? AND chunk_index = ?"
    );
    stmt.run(
        JSON.stringify(embeddingMaybe || []),
        chunkIdOrDocumentId,
        chunkIndexOrEmbedding
    );
}

/**
 * Get chunks by IDs
 */
export function getChunksByIds(chunkIds: string[]): Chunk[] {
    if (chunkIds.length === 0) return [];

    const placeholders = chunkIds.map(() => "?").join(",");
    const stmt = db.prepare(`SELECT * FROM chunks WHERE id IN (${placeholders})`);
    const rows = stmt.all(...chunkIds) as any[];

    return rows.map((row) => ({
        id: row.id,
        documentId: row.document_id,
        text: row.text,
        pageStart: row.page_start,
        pageEnd: row.page_end,
        chunkIndex: row.chunk_index,
        embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
        createdAt: row.created_at,
    }));
}
