/**
 * LLM Provider Abstraction Layer
 * Supports OpenAI, Google Gemini, and Anthropic Claude
 */

export interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface LLMProvider {
    chat(messages: Message[], stream: boolean): Promise<string | AsyncIterableIterator<string>>;
    embed(texts: string[]): Promise<number[][]>;
}

export interface LLMConfig {
    provider: "openai" | "gemini" | "claude";
    apiKey: string;
    model: string;
    embeddingModel?: string;
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider implements LLMProvider {
    private apiKey: string;
    private model: string;
    private embeddingModel: string;

    constructor(config: LLMConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model;
        this.embeddingModel = config.embeddingModel || "text-embedding-3-small";
    }

    async chat(messages: Message[], stream: boolean): Promise<string | AsyncIterableIterator<string>> {
        const url = "https://api.openai.com/v1/chat/completions";

        const body = {
            model: this.model,
            messages,
            stream,
            temperature: 0.7,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        if (stream) {
            return this.streamResponse(response);
        } else {
            const data = await response.json();
            return data.choices[0].message.content;
        }
    }

    private async *streamResponse(response: Response): AsyncIterableIterator<string> {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.slice(6);
                    if (data === "[DONE]") continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content;
                        if (content) yield content;
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }

    async embed(texts: string[]): Promise<number[][]> {
        const url = "https://api.openai.com/v1/embeddings";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.embeddingModel,
                input: texts,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI Embeddings API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data.map((item: any) => item.embedding);
    }
}

/**
 * Google Gemini Provider
 */
export class GeminiProvider implements LLMProvider {
    private apiKey: string;
    private model: string;

    constructor(config: LLMConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model;
    }

    async chat(messages: Message[], stream: boolean): Promise<string | AsyncIterableIterator<string>> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:${stream ? "streamGenerateContent" : "generateContent"
            }?key=${this.apiKey}`;

        // Convert messages to Gemini format
        const contents = this.convertMessages(messages);

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        if (stream) {
            return this.streamResponse(response);
        } else {
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        }
    }

    private convertMessages(messages: Message[]) {
        // Gemini uses a different message format
        return messages
            .filter((m) => m.role !== "system") // System messages handled separately
            .map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }));
    }

    private async *streamResponse(response: Response): AsyncIterableIterator<string> {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");

            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) yield text;
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }

    async embed(texts: string[]): Promise<number[][]> {
        // Gemini uses a different embedding endpoint
        const url = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${this.apiKey}`;

        const embeddings: number[][] = [];

        for (const text of texts) {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: { parts: [{ text }] },
                }),
            });

            if (!response.ok) {
                throw new Error(`Gemini Embeddings API error: ${response.statusText}`);
            }

            const data = await response.json();
            embeddings.push(data.embedding.values);
        }

        return embeddings;
    }
}

/**
 * Anthropic Claude Provider
 */
export class ClaudeProvider implements LLMProvider {
    private apiKey: string;
    private model: string;

    constructor(config: LLMConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model;
    }

    async chat(messages: Message[], stream: boolean): Promise<string | AsyncIterableIterator<string>> {
        const url = "https://api.anthropic.com/v1/messages";

        // Extract system message
        const systemMessage = messages.find((m) => m.role === "system")?.content || "";
        const conversationMessages = messages.filter((m) => m.role !== "system");

        const body = {
            model: this.model,
            max_tokens: 4096,
            system: systemMessage,
            messages: conversationMessages,
            stream,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.statusText}`);
        }

        if (stream) {
            return this.streamResponse(response);
        } else {
            const data = await response.json();
            return data.content[0].text;
        }
    }

    private async *streamResponse(response: Response): AsyncIterableIterator<string> {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.slice(6);

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.type === "content_block_delta") {
                            const text = parsed.delta?.text;
                            if (text) yield text;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }

    async embed(texts: string[]): Promise<number[][]> {
        // Claude doesn't have a native embedding API
        // Fall back to using Voyage AI or similar
        throw new Error(
            "Claude doesn't provide embeddings. Please use OpenAI or Gemini for embeddings."
        );
    }
}

/**
 * Factory function to create the appropriate provider
 */
export function createLLMProvider(config: LLMConfig): LLMProvider {
    switch (config.provider) {
        case "openai":
            return new OpenAIProvider(config);
        case "gemini":
            return new GeminiProvider(config);
        case "claude":
            return new ClaudeProvider(config);
        default:
            throw new Error(`Unknown provider: ${config.provider}`);
    }
}
