/**
 * Planner Agent
 * Generates structured learning plans from documents
 */

import { createLLMProvider, type LLMConfig, type Message } from "../llm/provider";
import { SYSTEM_PROMPTS } from "./prompts";
import db from "../storage/localDb";

export interface LearningPlan {
    outline: {
        title: string;
        chapters: Array<{
            title: string;
            topics: string[];
        }>;
    };
    parts: Part[];
}

export interface Part {
    id: string;
    title: string;
    objectives: string[];
    estimatedMinutes: number;
    prerequisites: string[];
    topics: string[];
}

/**
 * Generate a learning plan from document chunks
 */
export async function generatePlan(
    docId: string,
    documentTitle: string,
    sampleChunks: string[],
    config: LLMConfig
): Promise<LearningPlan> {
    const provider = createLLMProvider(config);

    // Prepare context from sample chunks
    const context = sampleChunks.slice(0, 10).join("\n\n---\n\n");

    const messages: Message[] = [
        {
            role: "system",
            content: SYSTEM_PROMPTS.planner,
        },
        {
            role: "user",
            content: `Please analyze this document and create a comprehensive learning plan.

Document Title: ${documentTitle}

Document Content (sample):
${context}

Create a structured learning plan with clear parts, objectives, and time estimates.`,
        },
    ];

    try {
        const response = await provider.chat(messages, false) as string;

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response;

        const plan: LearningPlan = JSON.parse(jsonStr);

        // Validate and sanitize
        if (!plan.parts || !Array.isArray(plan.parts)) {
            throw new Error("Invalid plan structure");
        }

        // Ensure all parts have IDs
        plan.parts = plan.parts.map((part, index) => ({
            ...part,
            id: part.id || `part-${index + 1}`,
            prerequisites: part.prerequisites || [],
            topics: part.topics || [],
        }));

        return plan;
    } catch (error) {
        console.error("Plan generation error:", error);
        throw new Error("Failed to generate learning plan. Please try again.");
    }
}

/**
 * Save plan to database
 */
export function savePlan(docId: string, plan: LearningPlan): void {
    const stmt = db.prepare(`
    INSERT INTO learning_plans (document_id, plan_json)
    VALUES (?, ?)
    ON CONFLICT(document_id) DO UPDATE SET
      plan_json = excluded.plan_json,
      updated_at = CURRENT_TIMESTAMP
  `);

    stmt.run(docId, JSON.stringify(plan));
}

/**
 * Get plan from database
 */
export function getPlan(docId: string): LearningPlan | null {
    const stmt = db.prepare("SELECT plan_json FROM learning_plans WHERE document_id = ?");
    const row = stmt.get(docId) as { plan_json: string } | undefined;

    if (!row) return null;

    return JSON.parse(row.plan_json);
}

/**
 * Get a specific part from the plan
 */
export function getPart(docId: string, partId: string): Part | null {
    const plan = getPlan(docId);
    if (!plan) return null;

    return plan.parts.find((p) => p.id === partId) || null;
}
