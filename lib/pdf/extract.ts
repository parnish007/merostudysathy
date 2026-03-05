import fs from "fs";

// Use require for pdf-parse as it doesn't have proper ESM support
const pdf = require("pdf-parse");


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

    // Extract text by page (pdf-parse doesn't provide this directly, so we use the full text)
    // For a production app, you'd want to use a library that extracts per-page text
    const pages = [
        {
            pageNumber: 1,
            text: data.text,
        },
    ];

    return {
        text: data.text,
        pageCount: data.numpages,
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
