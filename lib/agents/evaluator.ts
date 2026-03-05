/**
 * Evaluator Agent
 * Evaluates student answers and provides feedback
 */

import { createLLMProvider, type LLMConfig, type Message } from "../llm/provider";
import { retrieveTopK, formatChunksForContext } from "../rag/retrieve";
import { SYSTEM_PROMPTS } from "./prompts";
import type { Question } from "./practice";
import db from "../storage/localDb";

export interface Evaluation {
    score: number; // Overall score 0-100
    correctness: number; // 0-100
    completeness: number; // 0-100
    clarity: number; // 0-100
    feedback: string; // Detailed feedback
    corrections: string[]; // Specific errors to fix
    strengths: string[]; // What they did well
    improvements: string[]; // How to improve
    revisionTopics: string[]; // Topics to review
}

/**
 * Evaluate a student's answer
 */
export async function evaluateAnswer(
    docId: string,
    question: Question,
    userAnswer: string,
    config: LLMConfig
): Promise<Evaluation> {
    const provider = createLLMProvider(config);

    // Retrieve relevant chunks for context
    const chunks = await retrieveTopK(question.question, docId, 5, config);
    const contextText = formatChunksForContext(chunks);

    const messages: Message[] = [
        {
            role: "system",
            content: SYSTEM_PROMPTS.evaluator,
        },
        {
            role: "user",
            content: `Evaluate this student answer.

Question: ${question.question}
${question.type === "mcq" ? `\nOptions:\n${question.options?.join("\n")}` : ""}

Expected Answer: ${question.correctAnswer || question.answer}
Explanation: ${question.explanation}

Student Answer: ${userAnswer}

Source Material for Reference:
${contextText}

Provide detailed, constructive evaluation following the specified format.`,
        },
    ];

    try {
        const response = await provider.chat(messages, false) as string;

        // Extract JSON from response
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;

        const evaluation: Evaluation = JSON.parse(jsonStr);

        // Ensure all fields are present
        return {
            score: evaluation.score || 0,
            correctness: evaluation.correctness || 0,
            completeness: evaluation.completeness || 0,
            clarity: evaluation.clarity || 0,
            feedback: evaluation.feedback || "No feedback provided",
            corrections: evaluation.corrections || [],
            strengths: evaluation.strengths || [],
            improvements: evaluation.improvements || [],
            revisionTopics: evaluation.revisionTopics || [],
        };
    } catch (error) {
        console.error("Evaluation error:", error);
        throw new Error("Failed to evaluate answer. Please try again.");
    }
}

/**
 * Update progress based on evaluation
 */
export function updateProgress(
    docId: string,
    partId: string,
    evaluation: Evaluation
): void {
    // Get current progress
    const stmt = db.prepare("SELECT * FROM progress WHERE document_id = ?");
    let row = stmt.get(docId) as any;

    if (!row) {
        // Initialize progress
        const initStmt = db.prepare(`
      INSERT INTO progress (document_id, completed_parts, weak_topics, quiz_history)
      VALUES (?, '[]', '[]', '[]')
    `);
        initStmt.run(docId);
        row = stmt.get(docId);
    }

    const completedParts = JSON.parse(row.completed_parts || "[]");
    const weakTopics = JSON.parse(row.weak_topics || "[]");
    const quizHistory = JSON.parse(row.quiz_history || "[]");

    // Mark part as completed if score is high enough
    if (evaluation.score >= 70 && !completedParts.includes(partId)) {
        completedParts.push(partId);
    }

    // Add weak topics
    for (const topic of evaluation.revisionTopics) {
        if (!weakTopics.includes(topic)) {
            weakTopics.push(topic);
        }
    }

    // Add to quiz history
    quizHistory.push({
        partId,
        score: evaluation.score,
        timestamp: new Date().toISOString(),
    });

    // Keep only last 50 quiz attempts
    if (quizHistory.length > 50) {
        quizHistory.shift();
    }

    // Update database
    const updateStmt = db.prepare(`
    UPDATE progress
    SET completed_parts = ?,
        weak_topics = ?,
        quiz_history = ?,
        last_part_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE document_id = ?
  `);

    updateStmt.run(
        JSON.stringify(completedParts),
        JSON.stringify(weakTopics),
        JSON.stringify(quizHistory),
        partId,
        docId
    );
}

/**
 * Get progress for a document
 */
export function getProgress(docId: string) {
    const stmt = db.prepare("SELECT * FROM progress WHERE document_id = ?");
    const row = stmt.get(docId) as any;

    if (!row) {
        return {
            completedParts: [],
            weakTopics: [],
            quizHistory: [],
        };
    }

    return {
        completedParts: JSON.parse(row.completed_parts || "[]"),
        weakTopics: JSON.parse(row.weak_topics || "[]"),
        quizHistory: JSON.parse(row.quiz_history || "[]"),
    };
}
