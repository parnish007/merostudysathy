"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, CheckCircle2, Circle } from "lucide-react";

interface Part {
    id: string;
    title: string;
    objectives: string[];
    estimatedMinutes: number;
    completed?: boolean;
}

interface PlanSidebarProps {
    docId: string;
    selectedPart: string | null;
    onSelectPart: (partId: string) => void;
}

export function PlanSidebar({ docId, selectedPart, onSelectPart }: PlanSidebarProps) {
    const [plan, setPlan] = useState<Part[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadPlan();
    }, [docId]);

    const loadPlan = async () => {
        try {
            const res = await fetch(`/api/docs/${docId}/plan`);
            if (res.ok) {
                const data = await res.json();
                setPlan(data.plan?.parts || null);
            }
        } catch (error) {
            console.error("Failed to load plan:", error);
        } finally {
            setLoading(false);
        }
    };

    const generatePlan = async () => {
        setGenerating(true);
        try {
            const res = await fetch(`/api/docs/${docId}/plan`, { method: "POST" });
            if (res.ok) {
                await loadPlan();
            }
        } catch (error) {
            console.error("Failed to generate plan:", error);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="p-6 space-y-4">
                <div className="text-center space-y-2">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="font-medium">No Learning Plan Yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Generate a structured learning plan for this document
                    </p>
                </div>
                <Button onClick={generatePlan} disabled={generating} className="w-full">
                    {generating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        "Generate Plan"
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-4">
            <div>
                <h2 className="text-lg font-semibold mb-1">Learning Plan</h2>
                <p className="text-sm text-muted-foreground">{plan.length} parts</p>
            </div>

            <div className="space-y-2">
                {plan.map((part, index) => (
                    <button
                        key={part.id}
                        onClick={() => onSelectPart(part.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPart === part.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "hover:bg-accent border-transparent"
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                {part.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm mb-1">
                                    Part {index + 1}: {part.title}
                                </div>
                                <div className="text-xs opacity-75">~{part.estimatedMinutes} min</div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
