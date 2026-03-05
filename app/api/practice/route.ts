import { NextRequest, NextResponse } from "next/server";
import { getUserSettings } from "@/lib/storage/settings";
import { generateQuestions } from "@/lib/agents/practice";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { docId, partId, count = 5 } = body;

        // Get user settings
        const settings = getUserSettings();
        if (!settings) {
            return NextResponse.json(
                { error: "Please configure your API key in settings" },
                { status: 400 }
            );
        }

        // Generate questions
        const questions = await generateQuestions(docId, partId, count, {
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model,
        });

        return NextResponse.json({ questions, success: true });
    } catch (error) {
        console.error("Practice generation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate questions" },
            { status: 500 }
        );
    }
}
