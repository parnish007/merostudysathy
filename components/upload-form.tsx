"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function UploadForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [title, setTitle] = useState("");

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find((f) => f.type === "application/pdf");

        if (pdfFile) {
            await uploadPDF(pdfFile);
        } else {
            toast({
                title: "Invalid file",
                description: "Please upload a PDF file",
                variant: "destructive",
            });
        }
    }, []);

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            await uploadPDF(file);
        } else {
            toast({
                title: "Invalid file",
                description: "Please upload a PDF file",
                variant: "destructive",
            });
        }
    };

    const uploadPDF = async (file: File) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/docs/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                toast({
                    title: "PDF uploaded",
                    description: "Your document has been uploaded successfully",
                });
                router.push(`/doc/${data.docId}`);
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            toast({
                title: "Upload failed",
                description: "Failed to upload PDF. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTextSubmit = async () => {
        if (!textInput.trim() || !title.trim()) {
            toast({
                title: "Missing fields",
                description: "Please provide both title and text content",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/docs/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textInput, title }),
            });

            if (res.ok) {
                const data = await res.json();
                toast({
                    title: "Text uploaded",
                    description: "Your content has been saved successfully",
                });
                router.push(`/doc/${data.docId}`);
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            toast({
                title: "Upload failed",
                description: "Failed to save text. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
                <Tabs defaultValue="pdf" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
                        <TabsTrigger value="text">Paste Text</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pdf">
                        <div
                            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50"
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".pdf"
                                onChange={handleFileInput}
                                disabled={loading}
                            />

                            {loading ? (
                                <div className="space-y-4">
                                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                                    <p className="text-sm text-muted-foreground">Uploading...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                                    <div>
                                        <p className="text-lg font-medium">Drop your PDF here</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            or{" "}
                                            <label
                                                htmlFor="file-upload"
                                                className="text-primary cursor-pointer hover:underline"
                                            >
                                                browse files
                                            </label>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter document title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="text">Content</Label>
                            <textarea
                                id="text"
                                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Paste your text content here..."
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleTextSubmit} disabled={loading} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Save Text
                                </>
                            )}
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
