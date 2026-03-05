import { NextRequest } from "next/server";
import { getUserSettings } from "@/lib/storage/settings";
import { teachPart, answerQuestion, type TeachingContext } from "@/lib/agents/teacher";
import type { Message } from "@/lib/llm/provider";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { docId, partId, mode, message, conversationHistory } = body;

        // Get user settings
        const settings = getUserSettings();
        if (!settings) {
            return new Response(
                JSON.stringify({ error: "Please configure your API key in settings" }),
                { status: 400 }
            );
        }

        // Build teaching context
        const context: TeachingContext = {
            docId,
            partId,
            mode: mode || "simple",
            conversationHistory: conversationHistory || [],
        };

        // Create streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let generator: AsyncIterableIterator<string>;

                    if (message) {
                        // Answer a follow-up question
                        generator = answerQuestion(context, message, {
                            provider: settings.provider,
                            apiKey: settings.apiKey,
                            model: settings.model,
                        });
                    } else {
                        // Start teaching the part
                        generator = teachPart(context, null, {
                            provider: settings.provider,
                            apiKey: settings.apiKey,
                            model: settings.model,
                        });
                    }

                    for await (const chunk of generator) {
                        controller.enqueue(encoder.encode(chunk));
                    }

                    controller.close();
                } catch (error) {
                    console.error("Teaching stream error:", error);
                    const errorMessage = error instanceof Error ? error.message : "Teaching failed";
                    controller.enqueue(encoder.encode(`\n\n**Error**: ${errorMessage}`));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error) {
        console.error("Teach error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to generate teaching content" }),
            { status: 500 }
        );
    }
}
