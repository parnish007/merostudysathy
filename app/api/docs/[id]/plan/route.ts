import { NextRequest, NextResponse } from "next/server";
import { generatePlan, savePlan, getPlan } from "@/lib/agents/planner";
import { getUserSettings } from "@/lib/storage/settings";
import fs from "fs";
import path from "path";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const docId = params.id;
        const plan = getPlan(docId);

        if (!plan) {
            return NextResponse.json({ plan: null });
        }

        return NextResponse.json({ plan });
    } catch (error) {
        console.error("Plan GET error:", error);
        return NextResponse.json({ error: "Failed to load plan" }, { status: 500 });
    }
}

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

        if (!fs.existsSync(textPath)) {
            return NextResponse.json(
                { error: "Document text not found. Please re-upload." },
                { status: 404 }
            );
        }

        const fullText = fs.readFileSync(textPath, "utf-8");

        // Split into sample chunks for analysis
        const sampleChunks = fullText.split("\n\n").slice(0, 20);

        // Generate plan using AI
        const plan = await generatePlan(
            docId,
            doc.title,
            sampleChunks,
            {
                provider: settings.provider,
                apiKey: settings.apiKey,
                model: settings.model,
            }
        );

        // Save plan
        savePlan(docId, plan);

        return NextResponse.json({ plan, success: true });
    } catch (error) {
        console.error("Plan POST error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate plan" },
            { status: 500 }
        );
    }
}
