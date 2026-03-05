/**
 * Cost Estimation Utilities
 * Estimates API costs before making LLM calls
 */

export interface CostEstimate {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
    provider: string;
    model: string;
}

/**
 * Pricing per 1M tokens (as of 2024)
 */
const PRICING = {
    openai: {
        "gpt-4-turbo-preview": { input: 10.0, output: 30.0 },
        "gpt-4": { input: 30.0, output: 60.0 },
        "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
        "text-embedding-3-small": { input: 0.02, output: 0 },
        "text-embedding-3-large": { input: 0.13, output: 0 },
    },
    gemini: {
        "gemini-pro": { input: 0.5, output: 1.5 },
        "gemini-1.5-pro": { input: 3.5, output: 10.5 },
        "embedding-001": { input: 0.0, output: 0 },
    },
    claude: {
        "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
        "claude-3-sonnet-20240229": { input: 3.0, output: 15.0 },
        "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
    },
};

/**
 * Estimate tokens in text (rough: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Estimate cost for indexing a document
 */
export function estimateIndexingCost(
    textLength: number,
    provider: string,
    model: string,
    embeddingModel?: string
): CostEstimate {
    const tokens = estimateTokens(" ".repeat(textLength));
    const chunks = Math.ceil(tokens / 1000); // 1000 tokens per chunk

    // Embedding cost
    const pricing = PRICING[provider as keyof typeof PRICING];
    const embeddingPricing = embeddingModel
        ? (pricing as any)[embeddingModel]
        : (pricing as any)[Object.keys(pricing)[0]];

    const inputTokens = chunks * 1000;
    const cost = (inputTokens / 1_000_000) * (embeddingPricing?.input || 0);

    return {
        inputTokens,
        outputTokens: 0,
        totalCost: cost,
        provider,
        model: embeddingModel || model,
    };
}

/**
 * Estimate cost for plan generation
 */
export function estimatePlanCost(
    documentLength: number,
    provider: string,
    model: string
): CostEstimate {
    const pricing = PRICING[provider as keyof typeof PRICING];
    const modelPricing = (pricing as any)[model] || { input: 1.0, output: 2.0 };

    // Sample first 20 chunks for analysis
    const inputTokens = Math.min(20000, estimateTokens(" ".repeat(documentLength)));
    const outputTokens = 2000; // Estimated plan size

    const cost =
        (inputTokens / 1_000_000) * modelPricing.input +
        (outputTokens / 1_000_000) * modelPricing.output;

    return {
        inputTokens,
        outputTokens,
        totalCost: cost,
        provider,
        model,
    };
}

/**
 * Estimate cost for teaching session
 */
export function estimateTeachingCost(
    provider: string,
    model: string,
    contextChunks: number = 5
): CostEstimate {
    const pricing = PRICING[provider as keyof typeof PRICING];
    const modelPricing = (pricing as any)[model] || { input: 1.0, output: 2.0 };

    const inputTokens = contextChunks * 1000 + 500; // Context + prompt
    const outputTokens = 1500; // Estimated response

    const cost =
        (inputTokens / 1_000_000) * modelPricing.input +
        (outputTokens / 1_000_000) * modelPricing.output;

    return {
        inputTokens,
        outputTokens,
        totalCost: cost,
        provider,
        model,
    };
}

/**
 * Estimate cost for practice questions
 */
export function estimatePracticeCost(
    provider: string,
    model: string,
    questionCount: number = 5
): CostEstimate {
    const pricing = PRICING[provider as keyof typeof PRICING];
    const modelPricing = (pricing as any)[model] || { input: 1.0, output: 2.0 };

    const inputTokens = 5000; // Context chunks
    const outputTokens = questionCount * 300; // ~300 tokens per question

    const cost =
        (inputTokens / 1_000_000) * modelPricing.input +
        (outputTokens / 1_000_000) * modelPricing.output;

    return {
        inputTokens,
        outputTokens,
        totalCost: cost,
        provider,
        model,
    };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
    if (cost < 0.01) {
        return "< $0.01";
    }
    return `$${cost.toFixed(2)}`;
}

/**
 * Get total estimated cost for a document
 */
export function estimateTotalCost(
    documentLength: number,
    provider: string,
    model: string,
    embeddingModel?: string
): {
    indexing: CostEstimate;
    plan: CostEstimate;
    teaching: CostEstimate;
    practice: CostEstimate;
    total: number;
} {
    const indexing = estimateIndexingCost(documentLength, provider, model, embeddingModel);
    const plan = estimatePlanCost(documentLength, provider, model);
    const teaching = estimateTeachingCost(provider, model);
    const practice = estimatePracticeCost(provider, model);

    const total =
        indexing.totalCost +
        plan.totalCost +
        teaching.totalCost * 10 + // Assume 10 teaching sessions
        practice.totalCost * 5; // Assume 5 practice sessions

    return {
        indexing,
        plan,
        teaching,
        practice,
        total,
    };
}
