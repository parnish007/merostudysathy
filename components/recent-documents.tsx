"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import Link from "next/link";

interface Document {
    id: string;
    title: string;
    sourceType: string;
    pagesCount?: number;
    createdAt: string;
}

export function RecentDocuments() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const res = await fetch("/api/docs");
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents);
            }
        } catch (error) {
            console.error("Failed to load documents:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (documents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Documents</CardTitle>
                    <CardDescription>Your uploaded documents will appear here</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No documents yet. Upload a PDF or paste text to get started.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>Continue learning from your uploaded materials</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {documents.map((doc) => (
                        <Link key={doc.id} href={`/doc/${doc.id}`}>
                            <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate">{doc.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {doc.sourceType === "pdf" && doc.pagesCount && `${doc.pagesCount} pages • `}
                                        {formatDate(doc.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
