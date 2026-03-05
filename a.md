# Agentic Book/PDF Tutor (Local-Keys) — Build Spec + Context + Master Prompt

> Goal: Build a portfolio-grade **agentic study companion** that turns **PDFs/books/paragraphs** into a **topic plan** and then **teaches step-by-step** (1-by-1), with practice + evaluation + progress tracking.  
> Deployment: **NOT deploying**. Users clone repo and run locally. They paste their **own LLM API key** locally.  
> Priority: **Smooth UI, no lag, solid system design, agentic workflow, context retention**.

---

## 0) Product Summary (What you are building)

### What the app does
1. User uploads a PDF (or pastes text).
2. System extracts text, builds a structured outline (chapters → topics → subtopics).
3. System creates a learning plan (Parts).
4. User clicks “Start Part 1”.
5. Teacher agent teaches in a structured way (definition → why → theory → examples → formulas → mistakes → short notes).
6. Practice agent generates questions.
7. Evaluator agent checks user answers and gives feedback.
8. Progress tracker saves what is done and what is weak.
9. RAG search allows: “Explain page 12 again” / “Where is this defined in the PDF?”

### What makes it portfolio-strong
- Multi-agent orchestration (Analyzer + Planner + Teacher + Practice + Evaluator + Progress).
- RAG pipeline (chunking + embeddings + retrieval).
- UX: course dashboard, progress tracking, teaching mode, quiz mode.
- Performance: streaming, caching, chunking strategy, minimal tokens.

---

## 1) Non-goals (to keep it clean)
- No cloud deployment.
- No user accounts/auth.
- No payment.
- No heavy multi-user concurrency.
- No “agent browsing the web” (optional later).

---

## 2) Core Requirements Checklist

### Input
- [ ] Upload PDF (drag & drop).
- [ ] Paste text mode (paragraph/chapter).
- [ ] Optional: import .txt/.md.

### Processing
- [ ] PDF text extraction (fast + stable).
- [ ] Clean text (remove headers/footers, hyphen line breaks).
- [ ] Chunking with overlap.
- [ ] Embeddings + vector store for retrieval (local).
- [ ] Outline extraction (TOC if available, else LLM-assisted topic detection).
- [ ] Course plan generation (Parts + time estimate + prerequisites).

### Teaching
- [ ] Teach Part-by-Part (user controls pace).
- [ ] “Explain again (simpler / deeper / exam mode)”
- [ ] “Give examples” & “Give derivation” toggles.
- [ ] Citations back to PDF chunks/pages when possible.

### Practice & Evaluation
- [ ] MCQs + short answers + “why” questions.
- [ ] Evaluate answers (rubric + feedback).
- [ ] Track weak topics.

### UI
- [ ] PDF viewer pane + tutor chat pane.
- [ ] Plan sidebar (Parts list).
- [ ] Progress dashboard (completion + weak areas).
- [ ] Streaming response (no lag feeling).

### Local Keys
- [ ] Settings page: user pastes API key.
- [ ] Keys stored locally only (env/localStorage) and never committed.

---

## 3) Recommended Tech Stack (No-deploy, smooth UI)

### Option A (Best for your vibe coding): Next.js fullstack
- Next.js (App Router) + Tailwind + shadcn/ui
- Local API routes (`/app/api/*`)
- PDF parsing in Node (or use Python worker if needed)
- Vector store: `sqlite + vectordb` OR `Chroma` (local) OR `FAISS` (via python)
- Streaming: Server-Sent Events or Next.js streaming responses

### Option B (Best performance for PDFs): Hybrid
- Next.js UI
- Python FastAPI “worker” for PDF parsing + embeddings + retrieval
- Communicate via localhost HTTP

**Pick whichever you can finish cleanly.** If you want minimal pain: **Next.js-only** first.

---

## 4) System Design (High-level Architecture)

### Pipeline Overview
1) **Ingest**
- PDF → extract text → normalize → pages map
- Save `Document` metadata locally

2) **Index**
- Split into chunks (e.g., 800–1200 tokens, overlap 120–200)
- Create embeddings
- Store in vector DB
- Store chunk metadata: page range, section guess, chunk_id

3) **Plan**
- Try TOC extraction (fast heuristic)
- If no TOC: run LLM to propose outline from sampled chunks
- Create:
  - `Outline: Chapter → Topic → Subtopic`
  - `LearningPlan: Part 1..N`

4) **Teach**
- Teacher agent uses:
  - The current Part
  - Retrieved chunks from vector DB
  - User mode: (Simple / Deep / Exam)
- Streams explanation

5) **Practice**
- Generate questions strictly from retrieved chunks + plan
- Keep questions bounded (avoid hallucination)

6) **Evaluate**
- Evaluate user answer using:
  - Rubric + reference chunks
- Update progress + weak topics

---

## 5) Data Model (Local)

### Minimal local storage (JSON + SQLite recommended)
- `documents`
  - id, title, created_at
  - pages_count, source_path
- `chunks`
  - id, document_id, text, page_start, page_end, embedding_id
- `outline`
  - document_id, outline_json
- `learning_plan`
  - document_id, plan_json
- `progress`
  - document_id
  - completed_parts[]
  - weak_topics[]
  - quiz_history[]

If you want super simple MVP:
- Store everything as JSON files in `/data/<docId>/*.json`.

---

## 6) Agent Design (Roles + Rules)

### Agent 1: Analyzer
**Inputs:** extracted text/pages  
**Outputs:** cleaned text, TOC guess, topic signals, glossary terms  
**Rules:** No teaching. No plan. Only analysis.

### Agent 2: Planner
**Inputs:** analyzer output + sampling of chunks  
**Outputs:** learning plan (Parts), objectives, prerequisites  
**Rules:** Make parts small enough that user can do 10–20 minutes each.

### Agent 3: Retriever (Tool Agent)
**Inputs:** user query OR current Part  
**Outputs:** top-k chunks with page citations  
**Rules:** Retrieval first. If retrieval empty, ask user for more context (or increase k).

### Agent 4: Teacher
**Inputs:** current Part + retrieved chunks + user mode  
**Outputs:** lesson (structured) + quick recap  
**Rules:**
- Must cite pages/chunks when possible.
- Must not invent content not supported by retrieved text.
- Must stop and wait for user “Next” (if user wants that flow).

### Agent 5: Practice
**Inputs:** Part + retrieved chunks  
**Outputs:** questions + answers key (hidden or reveal button)  
**Rules:** Questions must be grounded in retrieved chunks.

### Agent 6: Evaluator
**Inputs:** question + user answer + reference chunks  
**Outputs:** score + feedback + fix explanation + what to revise  
**Rules:** Always explain mistakes.

### Agent 7: Progress Manager
**Inputs:** events from teaching/practice/eval  
**Outputs:** updated progress state  
**Rules:** Keep progress lightweight and fast.

---

## 7) Context Retention (How to retain context while vibe-coding)

You need 2 types of context:
1) **Project context** (architecture + decisions + file map)
2) **Document context** (PDF content + plan + progress)

### A) Project Context Files (must exist)
Create these files and keep them updated:

1. `AGENT_CONTEXT.md`
- What the product is
- Key architecture choices
- Current status
- “Do/Don’t” rules
- API contracts

2. `AGENT_CHANGELOG.md`
Every change:
- Date
- Files changed
- What/why
- Verification steps
- Next steps

3. `DECISIONS.md`
- Big decisions + rationale:
  - chunk size
  - vector db choice
  - streaming approach
  - storage approach

4. `ROADMAP.md`
- MVP → v1 → v2

### B) Runtime Context (per document)
Store per uploaded doc:
- `outline.json`
- `plan.json`
- `progress.json`
- `index_meta.json` (chunking params, embedding model used)

### C) “Context Budget” Rules (to avoid token waste + lag)
- Never send entire PDF to the LLM.
- Always do retrieval:
  - For teaching: retrieve top-k chunks for current Part.
  - For questions: retrieve top-k chunks for that subtopic.
- Keep prompts short; keep “system rules” stable; keep plan referenced by ID.

---

## 8) Performance (No lag system design)

### Key Principles
- **Stream** LLM output to UI (biggest “no lag” feel).
- Precompute:
  - extraction → chunking → embeddings (one-time).
- Cache:
  - retrieval results for each Part.
- Keep chunk size moderate (avoid too many chunks).
- Use background worker for indexing (even locally).

### Suggested Parameters
- Chunk size: ~1000 tokens
- Overlap: 150 tokens
- topK: 5–8 chunks
- Rerank (optional later): small reranker or LLM rerank

### UI Responsiveness Tricks
- Show “Indexing progress” with steps:
  1) Extracting
  2) Cleaning
  3) Chunking
  4) Embedding
  5) Building Plan
- Allow teaching before full indexing if TOC exists:
  - “Fast start mode” uses first pages + partial retrieval.

---

## 9) UI/UX Spec (Smooth + clean)

### Pages
1) `/`
- Upload PDF / Paste text
- “Recent documents” list

2) `/doc/[id]`
Layout:
- Left: Plan sidebar (Parts, Topics)
- Center: Tutor chat/lesson
- Right: PDF viewer (optional toggle)

Tabs:
- Learn
- Practice
- Progress
- Notes/Highlights

3) `/settings`
- LLM provider select
- API key input
- model select
- embedding model select (optional)

### Core Interactions
- Click Part → “Start teaching”
- Buttons:
  - “Explain simpler”
  - “Go deeper”
  - “Exam mode”
  - “Give MCQs”
  - “Test me”
  - “Next”

---

## 10) Safety & Key Handling (Local)
- Never commit keys.
- `.env.local` for server routes (optional).
- If user wants, store key only in browser localStorage.
- Provide “Clear key” button.

---

## 11) Minimal MVP Build Order (fast & clean)

### Phase 1 — Skeleton
- [ ] Next.js app + UI pages
- [ ] Settings screen for local API key
- [ ] Upload + parse PDF into plain text

### Phase 2 — Indexing
- [ ] Chunking + store chunks
- [ ] Embeddings + vector store
- [ ] Retrieval API

### Phase 3 — Plan
- [ ] Outline generation
- [ ] Learning plan parts list UI

### Phase 4 — Teach
- [ ] Teaching endpoint with retrieval + streaming
- [ ] “Next” flow

### Phase 5 — Practice + Evaluate
- [ ] Question generation
- [ ] Answer evaluation
- [ ] Progress tracking

### Phase 6 — Polish
- [ ] Caching
- [ ] Better citations
- [ ] Nice dashboard

---

## 12) API Contracts (keep stable)

### POST `/api/docs/upload`
- input: pdf file
- output: { docId }

### POST `/api/docs/:id/index`
- output: { status, progress }

### GET `/api/docs/:id/plan`
- output: { outline, plan }

### POST `/api/teach`
- input:
  - docId
  - partId
  - mode: "simple" | "deep" | "exam"
- output: streamed lesson text + citations

### POST `/api/practice`
- input: { docId, partId, type }
- output: questions

### POST `/api/evaluate`
- input: { docId, questionId, userAnswer }
- output: { score, feedback, nextRevision }

---

# 13) MASTER “VIBE CODING” PROMPT (In-depth, copy-paste)

You will paste this to your coding agent.  
It is designed to keep context, avoid chaos, and produce production-quality local app.

---

## Prompt Start

You are a Senior Full-Stack Engineer + AI Systems Architect. Build a local-only portfolio product:

**Project:** Agentic Book/PDF Tutor (Local LLM Keys)  
**Goal:** User uploads a PDF or pastes text. System builds an outline + learning plan and teaches the content part-by-part. It also generates practice questions, evaluates answers, and tracks progress.  
**No deployment.** Users run locally after cloning repo.  
**User supplies their own LLM API keys** locally (settings UI).  
**Priority:** smooth UI, streaming responses, no lag, strong system design.

### Absolute Rules
1) Work incrementally. Every change must update `AGENT_CHANGELOG.md` with:
   - timestamp
   - files changed
   - what/why
   - verification steps
   - risks
   - next steps
2) Maintain `AGENT_CONTEXT.md` as the single source of truth for architecture + current state.
3) Never send entire PDF to LLM. Always use retrieval.
4) Provide citations (page/chunk metadata) when generating lessons/questions.
5) Keep prompts short and stable; do not create giant prompts per request.
6) Must support streaming for teaching so UI never feels stuck.
7) Local-only key handling: never hardcode secrets, never commit keys.

### Tech Constraints
- Build with Next.js App Router + Tailwind + shadcn/ui.
- Implement local APIs in `/app/api/*`.
- Use a local vector store. Prefer:
  - simplest: store embeddings + metadata in SQLite (or a local lightweight vector store).
- PDF extraction must be reliable and not slow.
- Use server-side streaming for teaching responses.

### MVP Deliverables
1) UI:
   - Home: upload/paste + recent docs
   - Doc page: plan sidebar + tutor chat + optional pdf viewer
   - Settings: provider + API key input + model selection
2) Backend:
   - Upload → extract text → store per doc
   - Index: chunk + embed + store
   - Plan: outline + parts list
   - Teach: retrieval + streamed lesson
   - Practice: questions
   - Evaluate: score + feedback
   - Progress: store completion + weak topics

### System Design Requirements
- Document ingestion pipeline:
  - Extract text by page
  - Clean normalization
  - Chunk with overlap and keep page ranges
- Retrieval:
  - topK retrieval by part/topic query
  - return citations
- Teaching:
  - Strict structure in output:
    1) Definition
    2) Why needed
    3) Core theory (with “diagram in words” if relevant)
    4) Key formulas (and derivation if in text)
    5) Common mistakes
    6) Quick recap
  - End with: “Say Next to continue”
- Practice:
  - MCQs + short Qs grounded in retrieved chunks
- Evaluation:
  - Rubric-based scoring, clear corrections, suggest revision topic IDs

### File & Docs Requirements
Create and maintain:
- `AGENT_CONTEXT.md`
- `AGENT_CHANGELOG.md`
- `DECISIONS.md`
- `ROADMAP.md`

### Output Requirements (when you respond)
- Always list files created/changed.
- Provide full file contents when creating a new file.
- Provide minimal diffs when editing existing files.
- Provide verification steps after each change (how to run and test locally).
- Avoid unnecessary refactors. Keep it stable.

### Suggested Build Order
Phase 1: App scaffold + UI pages + settings key storage  
Phase 2: PDF upload/extract + local doc store  
Phase 3: chunking + embeddings + vector store + retrieval  
Phase 4: plan generation (outline + parts)  
Phase 5: teaching streaming endpoint + UI streaming  
Phase 6: practice + evaluation + progress  
Phase 7: polish (caching, citations, UX)

Start by generating the repo structure and the four context files, then implement Phase 1.

## Prompt End

---

## 14) “Done Definition” (How you know it’s complete)
- Upload PDF → index → plan appears
- Click Part 1 → teaching streams
- Ask “give mcqs” → questions appear
- Answer → evaluator gives feedback + updates progress
- App feels smooth (no long blank waits)
- All context files are kept up-to-date

---

## 15) Repo Structure (suggested)

.
├─ AGENT_CONTEXT.md
├─ AGENT_CHANGELOG.md
├─ DECISIONS.md
├─ ROADMAP.md
├─ app/
│  ├─ page.tsx
│  ├─ settings/page.tsx
│  ├─ doc/[id]/page.tsx
│  ├─ api/
│  │  ├─ docs/upload/route.ts
│  │  ├─ docs/[id]/index/route.ts
│  │  ├─ docs/[id]/plan/route.ts
│  │  ├─ teach/route.ts
│  │  ├─ practice/route.ts
│  │  ├─ evaluate/route.ts
│  └─ ...
├─ components/
│  ├─ TutorChat.tsx
│  ├─ PlanSidebar.tsx
│  ├─ PdfViewer.tsx
│  ├─ ProgressPanel.tsx
├─ lib/
│  ├─ pdf/extract.ts
│  ├─ text/clean.ts
│  ├─ rag/chunk.ts
│  ├─ rag/embed.ts
│  ├─ rag/store.ts
│  ├─ rag/retrieve.ts
│  ├─ agents/
│  │  ├─ planner.ts
│  │  ├─ teacher.ts
│  │  ├─ practice.ts
│  │  ├─ evaluator.ts
│  │  ├─ prompts.ts
│  ├─ storage/localDb.ts
│  ├─ storage/files.ts
└─ data/
   └─ (local doc storage)

---

If you want, I can also add a **“model/provider abstraction spec”** (OpenAI/Gemini/Claude switch) in the same style—so your agent never hardcodes one provider.
