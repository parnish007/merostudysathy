import { UploadForm } from "@/components/upload-form";
import { RecentDocuments } from "@/components/recent-documents";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Zap, BookOpen } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
    return (
        <div className="bg-gradient-to-b from-background to-muted/20">
            {/* Hero Section */}
            <section className="py-20 md:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />
                <div className="container px-4 mx-auto text-center space-y-6 max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in-up">
                        <Sparkles className="w-4 h-4" />
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">New: MeroStudySathy v1.0</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight pb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 dark:from-white dark:to-white/70">
                        Master Your PDFs with <br />
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI-Powered Learning</span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Stop highlighting text you&apos;ll never read again. Turn any document into an interactive tutor that explains concepts, tests your knowledge, and tracks your progress.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border shadow-sm text-sm">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span>Interactive Teaching</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border shadow-sm text-sm">
                            <Zap className="w-4 h-4 text-purple-500" />
                            <span>Instant Practice Quizzes</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Utilities */}
            <section className="container px-4 mx-auto pb-20">
                <div className="max-w-4xl mx-auto space-y-16">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <UploadForm />
                    </div>
                    <RecentDocuments />
                </div>
            </section>
        </div>
    );
}
