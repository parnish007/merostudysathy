import { NextRequest, NextResponse } from "next/server";
import { getUserSettings } from "@/lib/storage/settings";
import { evaluateAnswer, updateProgress } from "@/lib/agents/evaluator";
import type { Question } from "@/lib/agents/practice";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { docId, partId, question, userAnswer } = body;

        // Get user settings
        const settings = getUserSettings();
        if (!settings) {
            return NextResponse.json(
                { error: "Please configure your API key in settings" },
                { status: 400 }
            );
        }

        // Evaluate the answer
        const evaluation = await evaluateAnswer(docId, question as Question, userAnswer, {
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model,
        });

        // Update progress
        updateProgress(docId, partId, evaluation);

        return NextResponse.json({ evaluation, success: true });
    } catch (error) {
        console.error("Evaluation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to evaluate answer" },
            { status: 500 }
        );
    }
}
