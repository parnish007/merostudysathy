"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
    const { toast } = useToast();
    const [plan, setPlan] = useState<Part[] | null>(null);
    const [completedParts, setCompletedParts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadPlan();
        loadProgress();
    }, [docId]);

    useEffect(() => {
        if (!selectedPart && plan && plan.length > 0) {
            onSelectPart(plan[0].id);
        }
    }, [plan, selectedPart, onSelectPart]);

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

    const loadProgress = async () => {
        try {
            const res = await fetch(`/api/docs/${docId}/progress`);
            if (!res.ok) return;
            const data = await res.json();
            setCompletedParts(data.completedParts || []);
        } catch (error) {
            console.error("Failed to load progress:", error);
        }
    };

    const generatePlan = async () => {
        setGenerating(true);
        try {
            const indexRes = await fetch(`/api/docs/${docId}/index`, { method: "POST" });
            const indexData = await indexRes.json().catch(() => ({}));
            if (!indexRes.ok) {
                toast({
                    title: "Indexing failed",
                    description: indexData?.error || "Failed to prepare document for learning.",
                    variant: "destructive",
                });
                return;
            }

            const res = await fetch(`/api/docs/${docId}/plan`, { method: "POST" });
            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                await loadPlan();
                await loadProgress();
                if (data?.plan?.parts?.length > 0) {
                    onSelectPart(data.plan.parts[0].id);
                }
                toast({
                    title: "Plan generated",
                    description: "Your learning plan is ready.",
                });
            } else {
                toast({
                    title: "Plan generation failed",
                    description: data?.error || "Could not generate a plan for this document.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to generate plan:", error);
            toast({
                title: "Plan generation failed",
                description: "Network error while generating plan. Please try again.",
                variant: "destructive",
            });
        } finally {
            setGenerating(false);
        }
    };

    const togglePartCompletion = async (partId: string) => {
        try {
            const isCompleted = completedParts.includes(partId);
            const res = await fetch(`/api/docs/${docId}/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ partId, completed: !isCompleted }),
            });
            if (!res.ok) return;
            const data = await res.json();
            setCompletedParts(data.completedParts || []);
        } catch (error) {
            console.error("Failed to update completion:", error);
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
                                {completedParts.includes(part.id) ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePartCompletion(part.id);
                                        }}
                                        className="inline-flex"
                                        aria-label={`Mark ${part.title} as incomplete`}
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePartCompletion(part.id);
                                        }}
                                        className="inline-flex"
                                        aria-label={`Mark ${part.title} as complete`}
                                    >
                                        <Circle className="w-5 h-5 text-muted-foreground" />
                                    </button>
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
