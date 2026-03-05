"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, AlertCircle } from "lucide-react";

interface ProgressData {
    completedParts: string[];
    weakTopics: string[];
    totalParts: number;
    completionPercentage: number;
}

interface ProgressPanelProps {
    docId: string;
}

export function ProgressPanel({ docId }: ProgressPanelProps) {
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProgress();
    }, [docId]);

    const loadProgress = async () => {
        try {
            const res = await fetch(`/api/docs/${docId}/progress`);
            if (res.ok) {
                const data = await res.json();
                setProgress(data);
            }
        } catch (error) {
            console.error("Failed to load progress:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!progress) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <p>No progress data available yet</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Overall Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Overall Progress
                    </CardTitle>
                    <CardDescription>
                        {progress.completedParts.length} of {progress.totalParts} parts completed
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={progress.completionPercentage} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2 text-right">
                        {progress.completionPercentage}%
                    </p>
                </CardContent>
            </Card>

            {/* Weak Topics */}
            {progress.weakTopics.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Topics to Review
                        </CardTitle>
                        <CardDescription>
                            Focus on these areas to strengthen your understanding
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {progress.weakTopics.map((topic, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900"
                                >
                                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                    <span className="text-sm">{topic}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Completed Parts */}
            {progress.completedParts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Completed Parts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {progress.completedParts.map((partId) => (
                                <div
                                    key={partId}
                                    className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm"
                                >
                                    {partId}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
