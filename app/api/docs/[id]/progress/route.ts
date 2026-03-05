import { NextRequest, NextResponse } from "next/server";
import { getProgress } from "@/lib/agents/evaluator";
import { getPlan } from "@/lib/agents/planner";
import db from "@/lib/storage/localDb";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const docId = params.id;

        // Get progress
        const progress = getProgress(docId);

        // Get total parts from plan
        const plan = getPlan(docId);
        const totalParts = plan?.parts.length || 0;

        const completionPercentage = totalParts > 0
            ? Math.round((progress.completedParts.length / totalParts) * 100)
            : 0;

        return NextResponse.json({
            completedParts: progress.completedParts,
            weakTopics: progress.weakTopics,
            quizHistory: progress.quizHistory,
            totalParts,
            completionPercentage,
        });
    } catch (error) {
        console.error("Progress GET error:", error);
        return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const docId = params.id;
        const body = await request.json();
        const { partId, completed } = body as { partId?: string; completed?: boolean };

        if (!partId) {
            return NextResponse.json({ error: "partId is required" }, { status: 400 });
        }

        const stmt = db.prepare("SELECT completed_parts FROM progress WHERE document_id = ?");
        const row = stmt.get(docId) as { completed_parts: string } | undefined;

        let completedParts: string[] = row?.completed_parts
            ? JSON.parse(row.completed_parts)
            : [];

        const shouldComplete =
            typeof completed === "boolean" ? completed : !completedParts.includes(partId);

        if (shouldComplete) {
            if (!completedParts.includes(partId)) completedParts.push(partId);
        } else {
            completedParts = completedParts.filter((id) => id !== partId);
        }

        const upsert = db.prepare(`
          INSERT INTO progress (document_id, completed_parts, weak_topics, quiz_history, updated_at)
          VALUES (?, ?, '[]', '[]', CURRENT_TIMESTAMP)
          ON CONFLICT(document_id) DO UPDATE SET
            completed_parts = excluded.completed_parts,
            updated_at = CURRENT_TIMESTAMP
        `);

        upsert.run(docId, JSON.stringify(completedParts));

        return NextResponse.json({ success: true, completedParts });
    } catch (error) {
        console.error("Progress POST error:", error);
        return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }
}
