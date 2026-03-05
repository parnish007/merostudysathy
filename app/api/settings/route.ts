import { NextRequest, NextResponse } from "next/server";
import { getUserSettings, saveUserSettings, clearApiKeys } from "@/lib/storage/settings";

export async function GET() {
    try {
        const settings = getUserSettings();

        if (!settings) {
            return NextResponse.json({ configured: false }, { status: 200 });
        }

        // Don't send API key back to client
        return NextResponse.json({
            configured: true,
            provider: settings.provider,
            model: settings.model,
            embeddingModel: settings.embeddingModel,
        });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, apiKey, model, embeddingModel } = body;

        if (!provider || !model) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Only require API key if not already set (checked in wrapper logic) or get user settings first
        const currentSettings = getUserSettings();
        const finalApiKey = apiKey || currentSettings?.apiKey;

        if (!finalApiKey) {
            return NextResponse.json(
                { error: "API Key required" },
                { status: 400 }
            );
        }

        saveUserSettings({
            provider,
            apiKey: finalApiKey,
            model,
            embeddingModel,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        clearApiKeys();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Settings DELETE error:", error);
        return NextResponse.json({ error: "Failed to clear API key" }, { status: 500 });
    }
}
