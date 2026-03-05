"use client";

import { useState } from "react";
import { PlanSidebar } from "@/components/plan-sidebar";
import { TutorChat } from "@/components/tutor-chat";
import { ProgressPanel } from "@/components/progress-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, MessageSquare, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DocPage() {
    const params = useParams();
    const docId = params.id as string;
    const [selectedPart, setSelectedPart] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header */}
            <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Document Learning</h1>
                            <p className="text-xs text-muted-foreground">ID: {docId}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex h-[calc(100vh-73px)]">
                {/* Left Sidebar - Learning Plan */}
                <aside className="w-80 border-r bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
                    <PlanSidebar
                        docId={docId}
                        selectedPart={selectedPart}
                        onSelectPart={setSelectedPart}
                    />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden">
                    <Tabs defaultValue="learn" className="h-full flex flex-col">
                        <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-4">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="learn" className="gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Learn
                                </TabsTrigger>
                                <TabsTrigger value="progress" className="gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Progress
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="learn" className="flex-1 m-0 overflow-hidden">
                            <TutorChat docId={docId} selectedPart={selectedPart} />
                        </TabsContent>

                        <TabsContent value="progress" className="flex-1 m-0 overflow-y-auto p-6">
                            <ProgressPanel docId={docId} />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
}
