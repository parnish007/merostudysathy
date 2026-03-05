"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, Brain, Network, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step {
    id: 1 | 2 | 3;
    title: string;
    description: string;
    icon: React.ElementType;
}

const steps: Step[] = [
    {
        id: 1,
        title: "The Analyst",
        description: "Analyzing intent & complexity",
        icon: Brain,
    },
    {
        id: 2,
        title: "The Architect",
        description: "Structuring pedagogical path",
        icon: Network,
    },
    {
        id: 3,
        title: "The Manager",
        description: "Assigning specialized agents",
        icon: Users,
    },
];

interface PlanVisualizerProps {
    currentStep: 1 | 2 | 3 | 4; // 4 means complete
}

export function PlanVisualizer({ currentStep }: PlanVisualizerProps) {
    return (
        <Card className="w-full border-2 border-primary/10 shadow-xl bg-background/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
                <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-2xl">
                    Constructing Your Learning Path
                </CardTitle>
                <CardDescription>
                    Our multi-agent system is crafting a personalized course for you.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 max-w-3xl mx-auto">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[2.25rem] left-0 w-full h-0.5 bg-muted -z-10" />

                    {steps.map((step) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        const isPending = currentStep < step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-3 w-48 transition-all duration-500">
                                <div
                                    className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center border-4 z-10 transition-all duration-500 shadow-sm",
                                        isCompleted ? "bg-green-100 border-green-500 text-green-600 dark:bg-green-900/20" :
                                            isCurrent ? "bg-white border-blue-500 text-blue-600 scale-110 shadow-blue-500/20 dark:bg-gray-800" :
                                                "bg-muted border-muted-foreground/20 text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-8 h-8" />
                                    ) : isCurrent ? (
                                        <step.icon className="w-8 h-8 animate-pulse" />
                                    ) : (
                                        <step.icon className="w-6 h-6" />
                                    )}
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className={cn("font-bold text-sm", isCurrent ? "text-primary" : "text-muted-foreground")}>
                                        {step.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground px-2">
                                        {isCurrent ? (
                                            <span className="flex items-center justify-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" /> {step.description}
                                            </span>
                                        ) : step.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
