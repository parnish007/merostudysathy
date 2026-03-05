/**
 * Practice Agent
 * Generates practice questions from content
 */

import { createLLMProvider, type LLMConfig, type Message } from "../llm/provider";
import { retrieveTopK, formatChunksForContext } from "../rag/retrieve";
import { SYSTEM_PROMPTS } from "./prompts";
import { getPart } from "./planner";

export interface Question {
    id: string;
    type: "mcq" | "short" | "why";
    question: string;
    options?: string[];
    correctAnswer?: string;
    answer?: string;
    explanation: string;
    sourceChunks: string[];
}

/**
 * Generate practice questions for a part
 */
export async function generateQuestions(
    docId: string,
    partId: string,
    count: number,
    config: LLMConfig
): Promise<Question[]> {
    const provider = createLLMProvider(config);

    // Get part details
    const part = getPart(docId, partId);
    if (!part) {
        throw new Error("Part not found");
    }

    // Retrieve relevant chunks
    const query = part.title + " " + part.objectives.join(" ");
    const chunks = await retrieveTopK(query, docId, 8, config);
    const contextText = formatChunksForContext(chunks);

    const messages: Message[] = [
        {
            role: "system",
            content: SYSTEM_PROMPTS.practice,
        },
        {
            role: "user",
            content: `Generate ${count} practice questions for this learning part.

Part: ${part.title}

Learning Objectives:
${part.objectives.map((obj, i) => `${i + 1}. ${obj}`).join("\n")}

Source Material:
${contextText}

Create a mix of question types (MCQs, short answer, "why" questions) that test understanding of these objectives.`,
        },
    ];

    try {
        const response = await provider.chat(messages, false) as string;

        // Extract JSON from response
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;

        const questions: Question[] = JSON.parse(jsonStr);

        // Ensure all questions have IDs
        return questions.map((q, index) => ({
            ...q,
            id: q.id || `q${index + 1}`,
            sourceChunks: q.sourceChunks || chunks.slice(0, 2).map((c) => c.id),
        }));
    } catch (error) {
        console.error("Question generation error:", error);
        throw new Error("Failed to generate questions. Please try again.");
    }
}

/**
 * Get a random subset of questions
 */
export function selectRandomQuestions(questions: Question[], count: number): Question[] {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Check if an MCQ answer is correct
 */
export function checkMCQAnswer(question: Question, userAnswer: string): boolean {
    if (question.type !== "mcq") {
        throw new Error("Not an MCQ question");
    }

    return userAnswer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();
}
