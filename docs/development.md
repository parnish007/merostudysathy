# Development Guide

Everything you need to know to work on MeroStudySathy.

---

## Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Clone and Install

```bash
git clone https://github.com/parnish007/merostudysathy.git
cd merostudysathy
npm install
```

### Environment Setup

Create a `.env.local` file (optional, for development):

```bash
# Not required - settings stored in SQLite
# But useful for testing without UI
OPENAI_API_KEY=sk-...
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`

---

## Project Structure

```
merostudysathy/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── settings/          # Settings page
│   ├── doc/[id]/          # Document learning page
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── *.tsx             # Custom components
├── lib/                   # Core logic
│   ├── agents/           # AI agents
│   ├── llm/              # LLM providers
│   ├── rag/              # RAG pipeline
│   ├── storage/          # Database
│   └── pdf/              # PDF processing
├── docs/                  # Documentation
├── data/                  # Local data (gitignored)
│   ├── tutor.db          # SQLite database
│   └── uploads/          # Uploaded files
└── public/               # Static assets
```

---

## Tech Stack

### Framework
- **Next.js 14**: App Router, Server Components, API Routes
- **React 18**: UI library
- **TypeScript**: Type safety

### Styling
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: Component library
- **next-themes**: Dark mode

### Database
- **better-sqlite3**: Synchronous SQLite
- **Why SQLite**: Simple, local, no setup required

### PDF Processing
- **pdf-parse**: Extract text from PDFs
- **Why**: Lightweight, no external dependencies

### LLM Integration
- **OpenAI SDK**: GPT models
- **Google AI SDK**: Gemini models
- **Anthropic SDK**: Claude models

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow the existing code style:
- Use TypeScript
- Add types for everything
- Write clear comments
- Keep functions small and focused

### 3. Test Locally

```bash
npm run dev
```

Test your changes manually. We don't have automated tests yet (contributions welcome).

### 4. Build

```bash
npm run build
```

Make sure it builds without errors.

### 5. Commit

```bash
git add .
git commit -m "feat: add your feature description"
```

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

### 6. Push and PR

```bash
git push origin feature/your-feature-name
```

Open a pull request on GitHub.

---

## Code Style

### TypeScript

Use strict types:

```typescript
// Good
function processDocument(doc: Document): ProcessedDocument {
  // ...
}

// Bad
function processDocument(doc: any): any {
  // ...
}
```

### React Components

Use functional components with hooks:

```typescript
// Good
export function MyComponent({ prop }: { prop: string }) {
  const [state, setState] = useState("");
  return <div>{prop}</div>;
}

// Avoid
export class MyComponent extends React.Component {
  // ...
}
```

### Async/Await

Prefer async/await over promises:

```typescript
// Good
async function fetchData() {
  const data = await api.get();
  return data;
}

// Avoid
function fetchData() {
  return api.get().then(data => data);
}
```

### Error Handling

Always handle errors:

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error("Operation failed:", error);
  throw new Error("User-friendly error message");
}
```

---

## Adding a New LLM Provider

Want to add support for a new LLM? Here's how:

### 1. Create Provider Class

Add to `lib/llm/provider.ts`:

```typescript
export class NewProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async chat(messages: Message[], stream: boolean) {
    // Implement chat logic
  }

  async embed(texts: string[]) {
    // Implement embedding logic
  }
}
```

### 2. Update Factory Function

```typescript
export function createLLMProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    case "claude":
      return new ClaudeProvider(config);
    case "newprovider":
      return new NewProvider(config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
```

### 3. Update Settings UI

Add option to `components/settings-form.tsx`:

```typescript
<option value="newprovider">New Provider</option>
```

### 4. Test

- Configure API key in settings
- Upload a document
- Generate plan
- Verify teaching works
- Test practice questions

---

## Adding a New Agent

Want to add a new AI agent? Here's the pattern:

### 1. Create Agent File

Add to `lib/agents/your-agent.ts`:

```typescript
import { createLLMProvider, type LLMConfig } from "../llm/provider";
import { SYSTEM_PROMPTS } from "./prompts";

export async function yourAgentFunction(
  input: string,
  config: LLMConfig
): Promise<Output> {
  const provider = createLLMProvider(config);

  const messages = [
    { role: "system", content: SYSTEM_PROMPTS.yourAgent },
    { role: "user", content: input }
  ];

  const response = await provider.chat(messages, false);
  return parseResponse(response);
}
```

### 2. Add Prompt

Add to `lib/agents/prompts.ts`:

```typescript
export const YOUR_AGENT_PROMPT = `
You are an expert at [task].

Your job is to [description].

Output format: [format]
`;

export const SYSTEM_PROMPTS = {
  // ... existing prompts
  yourAgent: YOUR_AGENT_PROMPT,
};
```

### 3. Create API Route

Add to `app/api/your-route/route.ts`:

```typescript
import { yourAgentFunction } from "@/lib/agents/your-agent";
import { getUserSettings } from "@/lib/storage/settings";

export async function POST(request: Request) {
  const { input } = await request.json();
  const settings = getUserSettings();
  
  const result = await yourAgentFunction(input, {
    provider: settings.provider,
    apiKey: settings.apiKey,
    model: settings.model,
  });

  return Response.json({ result });
}
```

### 4. Use in Frontend

```typescript
const response = await fetch("/api/your-route", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ input: "..." }),
});

const { result } = await response.json();
```

---

## Database Migrations

SQLite schema is defined in `lib/storage/localDb.ts`.

### Adding a New Table

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS your_table (
    id TEXT PRIMARY KEY,
    field1 TEXT NOT NULL,
    field2 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
```

### Adding a Column

SQLite doesn't support ALTER TABLE easily. Instead:

1. Create new table with updated schema
2. Copy data from old table
3. Drop old table
4. Rename new table

Or just delete `/data/tutor.db` and let it recreate (loses data).

---

## Testing

### Manual Testing Checklist

- [ ] Settings save/load correctly
- [ ] PDF upload works
- [ ] Text paste works
- [ ] Document indexing completes
- [ ] Plan generation works
- [ ] Teaching streams correctly
- [ ] Citations display properly
- [ ] Practice questions generate
- [ ] Answer evaluation works
- [ ] Progress tracking updates
- [ ] Dark mode works
- [ ] Responsive on mobile

### Testing with Different LLMs

Test with all three providers:
- OpenAI (GPT-4, GPT-3.5)
- Google (Gemini Pro)
- Anthropic (Claude 3)

Each has quirks. Make sure all work.

### Testing Edge Cases

- Empty PDF
- Huge PDF (500+ pages)
- PDF with images only
- Malformed text
- Invalid API key
- Network errors
- Rate limit errors

---

## Debugging

### Enable Verbose Logging

Add to your code:

```typescript
console.log("Debug info:", variable);
```

Check browser console or terminal output.

### Database Inspection

Use SQLite browser:

```bash
npm install -g sqlite3
sqlite3 data/tutor.db
```

```sql
.tables
SELECT * FROM documents;
SELECT * FROM chunks LIMIT 5;
```

### LLM Response Issues

Check the raw response:

```typescript
const response = await provider.chat(messages, false);
console.log("Raw LLM response:", response);
```

Common issues:
- LLM not following JSON format
- Missing fields in response
- Unexpected response structure

---

## Performance Optimization

### Chunking

Current: 1000 tokens, 150 overlap

Adjust in `lib/rag/chunk.ts`:

```typescript
const chunks = chunkText(text, {
  chunkSize: 1000,  // Increase for fewer chunks
  overlap: 150,     // Decrease for less redundancy
});
```

Trade-offs:
- Larger chunks: Fewer API calls, less precise retrieval
- Smaller chunks: More API calls, more precise retrieval

### Embedding Batch Size

Current: 100 chunks per batch

Adjust in `lib/rag/embed.ts`:

```typescript
await generateEmbeddingsBatch(texts, config, 100);
```

Trade-offs:
- Larger batches: Faster indexing, risk rate limits
- Smaller batches: Slower indexing, safer

### Caching

Not implemented yet. See Phase 7 tasks.

---

## Deployment

### Local Deployment

```bash
npm run build
npm start
```

### Docker (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t learnflow .
docker run -p 3000:3000 -v $(pwd)/data:/app/data learnflow
```

### Vercel (Not Recommended)

This app uses SQLite, which doesn't work on serverless platforms. You'd need to:
1. Switch to PostgreSQL
2. Use pgvector for embeddings
3. Store files in S3 or similar

Not worth it for a local-first app.

---

## Common Issues

### "Module not found" errors

```bash
npm install
```

### Database locked errors

Close other connections to the database. SQLite allows only one writer at a time.

### PDF parsing fails

Some PDFs are scanned images. Use OCR first or paste text manually.

### Streaming doesn't work

Check browser console for errors. Make sure you're reading the stream correctly.

### High API costs

- Use smaller models (GPT-3.5 instead of GPT-4)
- Reduce chunk count (larger chunks)
- Cache responses (Phase 7)

---

## Contributing

### What We Need

- Automated tests (Jest, Playwright)
- Better error handling
- Response caching
- PDF viewer integration
- Mobile app
- Local LLM support (Ollama)

### How to Contribute

1. Check existing issues
2. Comment on issue you want to work on
3. Fork repo
4. Create feature branch
5. Make changes
6. Test thoroughly
7. Submit PR

### Code Review Process

- PRs reviewed within 48 hours
- Must pass build
- Must follow code style
- Must include description of changes

---

## Resources

### Documentation
- [Architecture](./architecture.md)
- [API Reference](./api-reference.md)

### External Docs
- [Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Google AI](https://ai.google.dev/docs)
- [Anthropic](https://docs.anthropic.com/)

---

**Questions? Open an issue on GitHub.**
