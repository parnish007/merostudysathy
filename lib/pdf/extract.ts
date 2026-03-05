import fs from "fs";

// Use direct parser entry to avoid pdf-parse's debug bootstrap path.
const pdf = require("pdf-parse/lib/pdf-parse.js");


export interface PDFExtractionResult {
    text: string;
    pageCount: number;
    pages: Array<{ pageNumber: number; text: string }>;
}

/**
 * Extract text from a PDF file
 */
export async function extractPDFText(filePath: string): Promise<PDFExtractionResult> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text || "";
    const pageCount = data.numpages || 1;

    // Extract text by page (pdf-parse doesn't provide this directly, so we use the full text)
    // For a production app, you'd want to use a library that extracts per-page text
    const pages = [
        {
            pageNumber: 1,
            text,
        },
    ];

    return {
        text,
        pageCount,
        pages,
    };
}

/**
 * Clean extracted text
 */
export function cleanText(text: string): string {
    return text
        .replace(/\r\n/g, "\n") // Normalize line endings
        .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
        .replace(/[^\S\n]+/g, " ") // Normalize whitespace
        .trim();
}
