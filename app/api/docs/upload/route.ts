import { NextRequest, NextResponse } from "next/server";
import { createDocument } from "@/lib/storage/files";
import { extractPDFText } from "@/lib/pdf/extract";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type");

        // Handle PDF upload
        if (contentType?.includes("multipart/form-data")) {
            const formData = await request.formData();
            const file = formData.get("file") as File;

            if (!file) {
                return NextResponse.json({ error: "No file provided" }, { status: 400 });
            }

            // Save file
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = path.join(UPLOAD_DIR, fileName);
            const buffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, buffer);

            // Extract text
            const { text, pageCount } = await extractPDFText(filePath);

            // Create document
            const doc = createDocument(
                file.name.replace(".pdf", ""),
                "pdf",
                filePath,
                pageCount
            );

            // Store extracted text for indexing
            const textPath = path.join(UPLOAD_DIR, `${doc.id}.txt`);
            fs.writeFileSync(textPath, text);

            return NextResponse.json({ docId: doc.id, success: true });
        }

        // Handle text paste
        if (contentType?.includes("application/json")) {
            const body = await request.json();
            const { text, title } = body;

            if (!text || !title) {
                return NextResponse.json(
                    { error: "Missing text or title" },
                    { status: 400 }
                );
            }

            // Create document
            const doc = createDocument(title, "text");

            // Store text
            const textPath = path.join(UPLOAD_DIR, `${doc.id}.txt`);
            fs.writeFileSync(textPath, text);

            return NextResponse.json({ docId: doc.id, success: true });
        }

        return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? `Failed to upload document: ${error.message}`
                        : "Failed to upload document",
            },
            { status: 500 }
        );
    }
}
