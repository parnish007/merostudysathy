import { NextResponse } from "next/server";
import { getAllDocuments } from "@/lib/storage/files";

export async function GET() {
    try {
        const documents = getAllDocuments();
        return NextResponse.json({ documents });
    } catch (error) {
        console.error("Documents GET error:", error);
        return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
    }
}
