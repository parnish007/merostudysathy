import { ExternalLink, Github, Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t py-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} MeroStudySathy. All rights reserved.</p>
                        <p className="text-xs mt-1">Local-first AI Tutor. Your data stays on your machine.</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
                            <span>Created by</span>
                            <Link
                                href="https://github.com/parnish007"
                                target="_blank"
                                className="font-medium text-foreground hover:text-primary flex items-center gap-1 transition-colors"
                            >
                                parnish007 <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>

                        <Link
                            href="https://github.com/parnish007/merostudysathy"
                            target="_blank"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Github className="w-5 h-5" />
                            <span className="sr-only">GitHub</span>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
