"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Trash2, Check, Eye, EyeOff } from "lucide-react";

export function SettingsForm() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState<string>("openai");
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("");
    const [isConfigured, setIsConfigured] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                if (data.provider) setProvider(data.provider);
                if (data.model) setModel(data.model);
                if (data.configured) setIsConfigured(true);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    const saveSettings = async () => {
        // If configured, we only need model/provider unless user entered a new key
        if (!isConfigured && !apiKey) {
            toast({
                title: "Missing API Key",
                description: "Please enter your API key to continue",
                variant: "destructive",
            });
            return;
        }

        if (!provider || !model) {
            toast({
                title: "Missing fields",
                description: "Please select a provider and model",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const payload: any = { provider, model };
            if (apiKey) payload.apiKey = apiKey;

            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast({
                    title: "Settings saved",
                    description: "Your configuration has been updated successfully",
                });
                setApiKey(""); // Clear input
                setIsConfigured(true);
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save settings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const clearApiKey = async () => {
        try {
            await fetch("/api/settings", { method: "DELETE" });
            setApiKey("");
            setIsConfigured(false);
            toast({
                title: "Configuration cleared",
                description: "Your settings have been reset",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to clear settings",
                variant: "destructive",
            });
        }
    };

    return (
        <Card className="w-full shadow-lg border-muted/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    LLM Configuration
                    {isConfigured && <span className="text-xs font-normal text-muted-foreground bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Configured</span>}
                </CardTitle>
                <CardDescription>
                    Configure your AI provider. API keys are encrypted and stored locally.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Provider Selection */}
                <div className="space-y-2">
                    <Label htmlFor="provider">AI Provider</Label>
                    <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger id="provider">
                            <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="gemini">Google Gemini</SelectItem>
                            <SelectItem value="claude">Anthropic Claude</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key {isConfigured && <span className="text-muted-foreground font-normal">(Leave empty to keep current key)</span>}</Label>
                    <div className="relative">
                        <Input
                            id="apiKey"
                            type={showKey ? "text" : "password"}
                            placeholder={isConfigured ? "••••••••••••••••" : "sk-..."}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className={isConfigured && !apiKey ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : ""}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowKey(!showKey)}
                        >
                            {showKey ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        We only use the key for this session. It never leaves your machine.
                    </p>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                    <Label htmlFor="model">Model Name</Label>
                    <Input
                        id="model"
                        placeholder={
                            provider === "openai"
                                ? "gpt-4-turbo-preview"
                                : provider === "gemini"
                                    ? "gemini-1.5-pro"
                                    : "claude-3-opus-20240229"
                        }
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Recommended: {provider === "openai" && "gpt-4o or gpt-3.5-turbo"}
                        {provider === "gemini" && "gemini-1.5-pro or gemini-1.5-flash"}
                        {provider === "claude" && "claude-3-5-sonnet-20240620"}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button onClick={saveSettings} disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving Configuration...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                    <Button onClick={clearApiKey} variant="outline" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
