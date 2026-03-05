import { NextRequest } from "next/server";
import { getUserSettings } from "@/lib/storage/settings";
import { teachPart, answerQuestion, type TeachingContext } from "@/lib/agents/teacher";
import type { Message } from "@/lib/llm/provider";
import { getSavedLesson, saveLesson } from "@/lib/storage/lessons";

async function* streamFromText(text: string): AsyncIterableIterator<string> {
    yield text;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { docId, partId, mode, message, conversationHistory } = body;
        const teachMode: "simple" | "detailed" | "examples" =
            mode === "detailed" || mode === "examples" ? mode : "simple";

        // For initial part teaching, prefer persisted local lesson cache first.
        if (!message) {
            const cachedLesson = getSavedLesson(docId, partId, teachMode);
            if (cachedLesson) {
                const encoder = new TextEncoder();
                const stream = new ReadableStream({
                    async start(controller) {
                        for await (const chunk of streamFromText(cachedLesson)) {
                            controller.enqueue(encoder.encode(chunk));
                        }
                        controller.close();
                    },
                });

                return new Response(stream, {
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "Transfer-Encoding": "chunked",
                    },
                });
            }
        }

        // Get user settings
        const settings = getUserSettings();
        if (!settings) {
            return new Response(
                JSON.stringify({
                    error:
                        "No API key configured and no cached lesson exists for this part.",
                }),
                { status: 400 }
            );
        }

        // Build teaching context
        const context: TeachingContext = {
            docId,
            partId,
            mode: teachMode,
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

                    let fullContent = "";
                    for await (const chunk of generator) {
                        fullContent += chunk;
                        controller.enqueue(encoder.encode(chunk));
                    }

                    // Persist initial lesson output for future/offline reuse.
                    if (!message && fullContent.trim()) {
                        saveLesson(docId, partId, teachMode, fullContent);
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
