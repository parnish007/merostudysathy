import { NextRequest, NextResponse } from "next/server";
import { analyzeIntent, createPedagogy, assignAgents } from "@/lib/agents/planner-chain";

export async function POST(req: NextRequest) {
    try {
        const { prompt, context } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // Layer 1: Analyst
        const intent = await analyzeIntent(prompt, context);

        // Layer 2: Architect
        const draftPlan = await createPedagogy(intent);

        // Layer 3: Manager
        const finalPlan = await assignAgents(draftPlan);

        return NextResponse.json({
            intent,
            plan: finalPlan
        });

    } catch (error) {
        console.error("Planning Chain Error:", error);
        return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
    }
}
