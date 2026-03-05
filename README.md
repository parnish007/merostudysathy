# MeroStudySathy

An intelligent PDF tutor that actually helps you learn instead of just highlighting text you'll never read again.

---

## The Problem

Let's be honest: learning from PDFs sucks.

You download a 200-page technical manual, open it with good intentions, and then what? You're on your own. No roadmap, no guidance, no feedback. Just you, a wall of text, and the creeping realization that you have no idea where to start.

Traditional study methods are broken:
- **No structure** - Which chapter first? What's actually important?
- **No interaction** - Reading is passive. Your brain checks out after page 3.
- **No feedback** - Did you actually understand that? Who knows.
- **No accountability** - Easy to skim, easier to forget.

You end up highlighting random sentences, taking notes you'll never review, and pretending you learned something.

---

## The Solution

LearnFlow turns static PDFs into interactive learning experiences. Think of it as having a patient tutor who actually read the material and knows how to teach it.

Here's what happens:

**1. Upload your PDF**  
Drop in any document - textbook, research paper, technical manual, whatever.

**2. AI analyzes and creates a learning plan**  
The system reads through your document, identifies the key concepts, and builds a structured learning path. No more guessing what to read first.

**3. Interactive teaching sessions**  
Instead of staring at walls of text, you get clear explanations following a proven teaching structure. The system breaks down concepts, explains why they matter, shows examples, and warns you about common mistakes.

**4. Practice with real questions**  
Multiple choice, short answer, and conceptual questions generated from your material. You answer, get detailed feedback, and actually know if you understood it.

**5. Track your progress**  
See what you've mastered, what needs work, and where you're struggling. No more lying to yourself about "getting it."

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR PDF DOCUMENT                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ PDF EXTRACTION │
                    │  (per-page)    │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ TEXT CHUNKING  │
                    │ 1000 tok/150   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   EMBEDDINGS   │
                    │  (your LLM)    │
                    └────────┬───────┘
                             │
                             ▼
                ┌────────────────────────┐
                │  SQLITE VECTOR STORE   │
                │    (local database)    │
                └───────────┬────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │ PLANNER │        │ TEACHER │        │PRACTICE │
   │  AGENT  │        │  AGENT  │        │  AGENT  │
   └────┬────┘        └────┬────┘        └────┬────┘
        │                  │                   │
        │                  │                   │
        ▼                  ▼                   ▼
   Learning Plan    Teaching Sessions    Quiz Questions
   (structured)     (with citations)     (with feedback)
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  EVALUATOR  │
                    │    AGENT    │
                    └──────┬──────┘
                           │
                           ▼
                    Progress Tracking
                    Weak Topic ID
```

Everything runs locally. Your documents never leave your machine.

---

## Data Flow Pipeline

```
UPLOAD PHASE
────────────
User uploads PDF
      │
      ├─→ Extract text (pdf-parse)
      │
      ├─→ Store in /data/uploads/{id}.txt
      │
      └─→ Create document record in SQLite


INDEXING PHASE
──────────────
User clicks "Generate Plan"
      │
      ├─→ Load document text
      │
      ├─→ Chunk text (1000 tokens, 150 overlap)
      │         │
      │         └─→ Store chunks in SQLite
      │
      ├─→ Generate embeddings (batch of 100)
      │         │
      │         └─→ Store vectors in SQLite
      │
      └─→ Analyze structure → Generate plan
                │
                └─→ Store plan in SQLite


LEARNING PHASE
──────────────
User selects a part
      │
      ├─→ Build query from part title
      │
      ├─→ Vector search (top-5 chunks)
      │         │
      │         └─→ Cosine similarity ranking
      │
      ├─→ Format context with citations
      │
      └─→ Stream teaching response
                │
                └─→ Display with [Source X, Page Y]


PRACTICE PHASE
──────────────
User switches to Practice
      │
      ├─→ Retrieve chunks for topic
      │
      ├─→ Generate questions (Practice Agent)
      │         │
      │         └─→ MCQ, Short Answer, Why Questions
      │
      ├─→ User submits answer
      │
      ├─→ Evaluate (Evaluator Agent)
      │         │
      │         ├─→ Score (0-100)
      │         ├─→ Detailed feedback
      │         └─→ Identify weak topics
      │
      └─→ Update progress in SQLite
```

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- An API key from OpenAI, Google AI, or Anthropic

### Installation

```bash
git clone https://github.com/parnish007/merostudysathy.git
cd merostudysathy
npm install
npm run dev
```

Open `http://localhost:3000`

### First-Time Setup

**1. Configure your API**

Click the settings icon. Choose your provider, paste your API key, and specify the model:
- OpenAI: `gpt-4-turbo-preview` or `gpt-3.5-turbo`
- Google: `gemini-pro` or `gemini-1.5-pro`
- Anthropic: `claude-3-opus-20240229` or `claude-3-sonnet-20240229`

Your key gets encrypted and stored locally. Nobody else sees it.

**2. Upload a document**

Drag and drop a PDF or paste text directly. Wait for it to process.

**3. Generate a learning plan**

Hit "Generate Plan" and let the AI analyze your document. This takes a minute or two depending on size.

**4. Start learning**

Pick a section from the sidebar. Read the explanation. Ask questions. Move to the next section when ready.

**5. Practice**

Switch to the Practice tab. Answer questions. Get feedback. See what you actually learned.

---

## Features

### What Works Right Now

- Multi-provider LLM support (OpenAI, Google, Anthropic)
- Encrypted local storage for API keys
- PDF text extraction with page tracking
- Intelligent text chunking with context overlap
- Vector embeddings and similarity search
- AI-generated learning plans
- Streaming teaching sessions with source citations
- Practice question generation (MCQ, short answer, conceptual)
- Answer evaluation with detailed feedback
- Progress tracking and weak topic identification
- Response caching (60-80% cost reduction)
- PDF viewer with navigation and zoom
- Dark mode
- Responsive design

### What's Coming

- Spaced repetition scheduling
- Collaborative learning features
- Mobile app
- Local LLM support (Ollama)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (better-sqlite3) |
| PDF Processing | pdf-parse |
| LLM Integration | OpenAI / Gemini / Claude APIs |
| Vector Search | Cosine similarity |
| Encryption | AES-256-CBC |

---

## Privacy & Security

Everything stays on your machine:
- Documents stored in local `/data` folder
- API keys encrypted with machine-specific keys
- Vector embeddings in local SQLite database
- No external servers, no data collection, no telemetry

Delete the `/data` folder and everything's gone. Simple as that.

---

## Project Structure

```
merostudysathy/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── settings/          # Settings page
│   ├── doc/[id]/          # Learning interface
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn components
│   └── *.tsx             # Custom components
├── lib/                   # Core logic
│   ├── agents/           # AI agents
│   ├── llm/              # LLM providers
│   ├── rag/              # RAG pipeline
│   ├── storage/          # Database & cache
│   └── pdf/              # PDF processing
├── docs/                  # Documentation
│   ├── architecture.md
│   ├── api-reference.md
│   └── development.md
└── data/                  # Local data (gitignored)
    ├── tutor.db          # SQLite database
    └── uploads/          # Uploaded files
```

---

## Documentation

Detailed documentation is in the `/docs` folder:
- [Architecture Overview](./docs/architecture.md) - System design and data flow
- [API Reference](./docs/api-reference.md) - Complete endpoint documentation
- [Development Guide](./docs/development.md) - Setup and contribution guide

---

## Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

---

## How the Teaching Works

The system follows a 7-part teaching structure based on educational research:

1. **Definition** - What is this concept?
2. **Why It Matters** - Real-world relevance
3. **Core Theory** - How it actually works
4. **Examples** - Concrete applications
5. **Common Mistakes** - What to avoid
6. **Recap** - Quick summary
7. **Next Steps** - What's coming next

Every lesson includes citations to specific pages in your document. You can verify everything.

---

## Contributing

This started as a personal project to solve my own learning problems. If you find it useful and want to contribute, feel free to open an issue or submit a PR.

---

## License

MIT - Use it however you want.

---

**Questions? Issues? Check the [documentation](./docs/) or open an issue on GitHub.**
