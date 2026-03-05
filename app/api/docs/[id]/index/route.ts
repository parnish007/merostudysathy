import { NextRequest, NextResponse } from "next/server";
import { getUserSettings } from "@/lib/storage/settings";
import { chunkTextWithPages } from "@/lib/rag/chunk";
import { generateEmbeddingsBatch } from "@/lib/rag/embed";
import { createChunk, updateChunkEmbedding } from "@/lib/storage/files";
import { extractPDFText } from "@/lib/pdf/extract";
import fs from "fs";
import path from "path";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const docId = params.id;

        // Get user settings
        const settings = getUserSettings();
        if (!settings) {
            return NextResponse.json(
                { error: "Please configure your API key in settings" },
                { status: 400 }
            );
        }

        // Get document
        const db = require("@/lib/storage/localDb").default;
        const stmt = db.prepare("SELECT * FROM documents WHERE id = ?");
        const doc = stmt.get(docId) as any;

        if (!doc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Get document text
        const uploadDir = path.join(process.cwd(), "data", "uploads");
        const textPath = path.join(uploadDir, `${docId}.txt`);

        let pages: Array<{ pageNumber: number; text: string }> = [];

        if (doc.source_type === "pdf" && doc.source_path) {
            // Extract per-page text from PDF
            const pdfResult = await extractPDFText(doc.source_path);
            pages = pdfResult.pages;
        } else if (fs.existsSync(textPath)) {
            // For text documents, treat as single page
            const text = fs.readFileSync(textPath, "utf-8");
            pages = [{ pageNumber: 1, text }];
        } else {
            return NextResponse.json(
                { error: "Document text not found" },
                { status: 404 }
            );
        }

        // Chunk the text
        const chunks = chunkTextWithPages(pages, {
            chunkSize: 1000,
            overlap: 150,
            preserveParagraphs: true,
        });

        // Store chunks in database
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            createChunk(
                docId,
                chunk.text,
                chunk.pageStart,
                chunk.pageEnd,
                i
            );
        }

        // Generate embeddings in batches
        const chunkTexts = chunks.map((c) => c.text);
        const embeddings = await generateEmbeddingsBatch(chunkTexts, {
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model,
            embeddingModel: settings.embeddingModel,
        });

        // Update chunks with embeddings
        for (let i = 0; i < chunks.length; i++) {
            updateChunkEmbedding(docId, i, embeddings[i]);
        }

        return NextResponse.json({
            success: true,
            chunksCreated: chunks.length,
            message: "Document indexed successfully",
        });
    } catch (error) {
        console.error("Indexing error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to index document" },
            { status: 500 }
        );
    }
}
