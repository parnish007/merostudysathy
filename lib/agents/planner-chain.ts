import { getUserSettings } from "@/lib/storage/settings";
import { createLLMProvider } from "@/lib/llm/provider";

export interface StructuredIntent {
    topic: string;
    goal: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    keyConcepts: string[];
    targetAudience: string;
}

export interface DraftPlan {
    title: string;
    overview: string;
    modules: {
        title: string;
        goal: string;
        topics: string[];
    }[];
}

export interface FinalPlan extends DraftPlan {
    modules: {
        title: string;
        goal: string;
        topics: string[];
        assignedAgent: "Concept Teacher" | "Code Expert" | "Math Tutor" | "Historian" | "General Tutor";
        reasoning: string;
    }[];
}

async function getProvider() {
    const settings = getUserSettings();
    if (!settings) throw new Error("Settings not configured");

    return createLLMProvider({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        embeddingModel: settings.embeddingModel,
    });
}

async function generateJSON(prompt: string): Promise<any> {
    const provider = await getProvider();

    try {
        const raw = await provider.chat(
            [
                {
                    role: "system",
                    content:
                        "You are a JSON-only response bot. Return valid JSON only and no markdown.",
                },
                { role: "user", content: `${prompt}\n\nRespond strictly in JSON.` },
            ],
            false
        );
        let content = typeof raw === "string" ? raw : "";

        // Clean markdown code blocks if present
        content = content.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(content);
    } catch (e) {
        console.error("LLM Generation Error", e);
        throw new Error("Failed to generate valid JSON response from LLM");
    }
}

// Layer 1: The Analyst
export async function analyzeIntent(prompt: string, contextSnippet?: string): Promise<StructuredIntent> {
    const promptText = `
    Analyze the user's learning request and optional context to create a structured learning intent.
    
    User Request: "${prompt}"
    ${contextSnippet ? `Context from PDF/Text: "${contextSnippet.substring(0, 1000)}..."` : ""}

    Output JSON format:
    {
        "topic": "Main Subject",
        "goal": "Specific learning objective",
        "difficulty": "beginner" | "intermediate" | "advanced",
        "keyConcepts": ["Concept 1", "Concept 2"],
        "targetAudience": "e.g., 5th grader, Software Engineer, General public"
    }
    `;
    return await generateJSON(promptText);
}

// Layer 2: The Architect
export async function createPedagogy(intent: StructuredIntent): Promise<DraftPlan> {
    const promptText = `
    Act as a Curriculum Architect. Design a learning path for:
    Topic: ${intent.topic}
    Goal: ${intent.goal}
    Level: ${intent.difficulty}
    Audience: ${intent.targetAudience}

    Structure the course logically. 
    Output JSON format:
    {
        "title": "Engaging Course Title",
        "overview": "Brief description of the course",
        "modules": [
            {
                "title": "Module 1 Title",
                "goal": "What the user will learn in this module",
                "topics": ["Key point 1", "Key point 2"]
            }
        ]
    }
    `;
    return await generateJSON(promptText);
}

// Layer 3: The Manager
export async function assignAgents(draftPlan: DraftPlan): Promise<FinalPlan> {
    const promptText = `
    Act as a Faculty Manager. Assign the best specialized teaching agent for each module of this course: "${draftPlan.title}".

    Available Agents:
    - "Concept Teacher": Best for general concepts, history, theory.
    - "Code Expert": Best for programming, algorithms, technical implementation.
    - "Math Tutor": Best for equations, physics, logic.
    - "General Tutor": Fallback for mixed content.

    Modules to Assign:
    ${JSON.stringify(draftPlan.modules)}

    Output JSON format (same structure, but add 'assignedAgent' and 'reasoning' to each module):
    {
        "title": "...",
        "overview": "...",
        "modules": [
            {
                "title": "...",
                "goal": "...",
                "topics": [...],
                "assignedAgent": "Code Expert",
                "reasoning": "This module involves writing Python scripts."
            }
        ]
    }
    `;
    return await generateJSON(promptText);
}
