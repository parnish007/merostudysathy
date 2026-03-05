"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2, BookOpen } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
    citations?: Array<{ page?: number; chunk?: string }>;
}

interface TutorChatProps {
    docId: string;
    selectedPart: string | null;
}

export function TutorChat({ docId, selectedPart }: TutorChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (selectedPart) {
            startTeaching();
        }
    }, [selectedPart]);

    const startTeaching = async () => {
        if (!selectedPart) return;

        setLoading(true);
        setMessages([]);

        try {
            const res = await fetch("/api/teach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    docId,
                    partId: selectedPart,
                    mode: "simple",
                }),
            });

            if (!res.ok) throw new Error("Teaching failed");

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let content = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    content += chunk;

                    setMessages([{ role: "assistant", content }]);
                }
            }
        } catch (error) {
            console.error("Teaching error:", error);
            setMessages([
                {
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please make sure you've configured your API key in settings.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/teach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    docId,
                    partId: selectedPart,
                    mode: "simple",
                    message: input,
                }),
            });

            if (!res.ok) throw new Error("Response failed");

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let content = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    content += chunk;

                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage?.role === "assistant") {
                            lastMessage.content = content;
                        } else {
                            newMessages.push({ role: "assistant", content });
                        }
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error("Message error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!selectedPart) {
        return (
            <div className="h-full flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
                    <div>
                        <h3 className="text-lg font-medium mb-2">Select a Part to Start Learning</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Choose a part from the learning plan on the left to begin your interactive lesson
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <Card
                            className={`max-w-[80%] p-4 ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                        >
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {msg.content.split("\n").map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                            {msg.citations && msg.citations.length > 0 && (
                                <div className="mt-3 pt-3 border-t text-xs opacity-75">
                                    <span className="font-medium">Sources: </span>
                                    {msg.citations.map((c, i) => (
                                        <span key={i}>
                                            {c.page && `Page ${c.page}`}
                                            {i < msg.citations!.length - 1 && ", "}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <Card className="p-4 bg-muted">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </Card>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <div className="flex gap-2">
                    <Input
                        placeholder="Ask a question or say 'Next' to continue..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        disabled={loading}
                    />
                    <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
