import { NextRequest, NextResponse } from "next/server";
import { getProgress } from "@/lib/agents/evaluator";
import { getPlan } from "@/lib/agents/planner";

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
