/**
 * Teacher Agent
 * Provides interactive teaching with RAG
 */

import { createLLMProvider, type LLMConfig, type Message } from "../llm/provider";
import { retrieveTopK, formatChunksForContext, getCitations } from "../rag/retrieve";
import { SYSTEM_PROMPTS } from "./prompts";
import { getPart } from "./planner";

export interface TeachingContext {
    docId: string;
    partId: string;
    mode: "simple" | "detailed" | "examples";
    conversationHistory: Message[];
}

/**
 * Teach a specific part with streaming
 */
export async function* teachPart(
    context: TeachingContext,
    userMessage: string | null,
    config: LLMConfig
): AsyncIterableIterator<string> {
    const provider = createLLMProvider(config);

    // Get the part details
    const part = getPart(context.docId, context.partId);
    if (!part) {
        throw new Error("Part not found");
    }

    // Build query for retrieval
    const query = userMessage || part.title + " " + part.objectives.join(" ");

    // Retrieve relevant chunks
    const chunks = await retrieveTopK(query, context.docId, 5, config);
    const contextText = formatChunksForContext(chunks);
    const citations = getCitations(chunks);

    // Build messages
    const messages: Message[] = [
        {
            role: "system",
            content: SYSTEM_PROMPTS.teacher,
        },
        {
            role: "system",
            content: `You are teaching Part ${context.partId}: "${part.title}"

Learning Objectives:
${part.objectives.map((obj, i) => `${i + 1}. ${obj}`).join("\n")}

Relevant Source Material:
${contextText}

Remember to follow the 7-part teaching structure and cite your sources using [Source X, Page Y] format.`,
        },
        ...context.conversationHistory,
    ];

    // Add user message if provided
    if (userMessage) {
        messages.push({
            role: "user",
            content: userMessage,
        });
    } else {
        // Initial teaching
        messages.push({
            role: "user",
            content: `Please teach me about "${part.title}" following the 7-part structure. Use the source material provided and cite your sources.`,
        });
    }

    // Stream response
    const stream = await provider.chat(messages, true) as AsyncIterableIterator<string>;

    for await (const chunk of stream) {
        yield chunk;
    }

    // Note: Citations are included in the streamed response via the prompt
    // The UI can parse [Source X, Page Y] patterns to display citations
}

/**
 * Answer a follow-up question
 */
export async function* answerQuestion(
    context: TeachingContext,
    question: string,
    config: LLMConfig
): AsyncIterableIterator<string> {
    // Retrieve relevant chunks for the question
    const chunks = await retrieveTopK(question, context.docId, 3, config);
    const contextText = formatChunksForContext(chunks);

    const provider = createLLMProvider(config);

    const messages: Message[] = [
        {
            role: "system",
            content: `You are a helpful teacher answering student questions. Be concise but thorough. Always cite your sources.

Relevant Source Material:
${contextText}`,
        },
        ...context.conversationHistory,
        {
            role: "user",
            content: question,
        },
    ];

    const stream = await provider.chat(messages, true) as AsyncIterableIterator<string>;

    for await (const chunk of stream) {
        yield chunk;
    }
}
