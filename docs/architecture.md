# Architecture Overview

This document explains how MeroStudySathy actually works under the hood.

---

## System Design

MeroStudySathy is a multi-agent RAG (Retrieval-Augmented Generation) system. That's a fancy way of saying it combines vector search with LLMs to teach you stuff from your documents.

### High-Level Flow

```
1. You upload a PDF
2. System extracts text and splits it into chunks
3. Chunks get converted to vector embeddings
4. Embeddings stored in local SQLite database
5. When you ask a question or request teaching:
   - System finds relevant chunks via similarity search
   - Passes chunks to LLM as context
   - LLM generates response with citations
6. Rinse and repeat
```

---

## Components

### 1. Document Processing Pipeline

**Location**: `lib/pdf/extract.ts`, `lib/rag/chunk.ts`

**What it does**:
- Extracts text from PDFs (page by page)
- Cleans up formatting issues
- Splits text into overlapping chunks (1000 tokens each, 150 token overlap)
- Preserves paragraph boundaries when possible

**Why overlap matters**: Context. If a concept spans two chunks, the overlap ensures we don't lose meaning at the boundaries.

### 2. Vector Embedding System

**Location**: `lib/rag/embed.ts`, `lib/llm/provider.ts`

**What it does**:
- Converts text chunks into numerical vectors (embeddings)
- Uses your chosen LLM's embedding API
- Processes in batches to avoid rate limits
- Stores vectors in SQLite

**Why vectors**: They let us do semantic search. "Machine learning" and "neural networks" are different words but similar concepts. Vector similarity catches that.

### 3. Retrieval System

**Location**: `lib/rag/retrieve.ts`

**What it does**:
- Takes your query (question or topic)
- Converts it to a vector
- Finds the most similar chunks using cosine similarity
- Returns top-K results with scores

**Cosine similarity**: Measures the angle between vectors. Closer angle = more similar meaning.

### 4. AI Agents

Four specialized agents handle different tasks:

#### Planner Agent
**Location**: `lib/agents/planner.ts`

**Job**: Analyze your document and create a structured learning plan.

**Process**:
1. Samples chunks from your document
2. Sends to LLM with specialized prompt
3. LLM returns JSON with parts, objectives, time estimates
4. Stores plan in database

**Output**: Learning plan with logical progression (easy to hard, prerequisites handled)

#### Teacher Agent
**Location**: `lib/agents/teacher.ts`

**Job**: Explain concepts using retrieved context.

**Process**:
1. Takes the current learning part
2. Retrieves relevant chunks via vector search
3. Builds context with citations
4. Streams explanation following 7-part structure
5. Handles follow-up questions

**7-Part Structure**:
1. Definition
2. Why it matters
3. Core theory
4. Examples
5. Common mistakes
6. Recap
7. Next steps

#### Practice Agent
**Location**: `lib/agents/practice.ts`

**Job**: Generate practice questions from content.

**Process**:
1. Retrieves relevant chunks for the topic
2. Sends to LLM with question generation prompt
3. LLM returns mix of MCQs, short answer, and conceptual questions
4. Each question includes source chunk references

**Question types**:
- Multiple choice (tests recognition)
- Short answer (tests recall)
- "Why" questions (tests understanding)

#### Evaluator Agent
**Location**: `lib/agents/evaluator.ts`

**Job**: Score answers and provide feedback.

**Process**:
1. Takes student answer and correct answer
2. Retrieves context from source material
3. LLM evaluates on three dimensions:
   - Correctness (factual accuracy)
   - Completeness (coverage of key points)
   - Clarity (organization and expression)
4. Returns score, feedback, and revision topics
5. Updates progress tracking

---

## Data Flow

### Complete System Flow

```
┌─────────────┐
│   UPLOAD    │
└──────┬──────┘
       │
       ├─→ PDF Extraction ──→ Text Cleaning ──→ Store /data/uploads/
       │
       └─→ Create Document Record in SQLite
                    │
                    ▼
┌─────────────────────────┐
│      INDEXING           │
└──────┬──────────────────┘
       │
       ├─→ Load Text ──→ Chunk (1000/150) ──→ Store Chunks
       │
       ├─→ Generate Embeddings (batch 100) ──→ Store Vectors
       │
       └─→ Analyze Structure ──→ Generate Plan ──→ Store Plan
                    │
                    ▼
┌─────────────────────────┐
│      LEARNING           │
└──────┬──────────────────┘
       │
       ├─→ Select Part ──→ Build Query
       │
       ├─→ Vector Search ──→ Top-K Chunks (cosine similarity)
       │
       ├─→ Format Context ──→ Add Citations
       │
       └─→ Stream Teaching ──→ Display with [Source X, Page Y]
                    │
                    ▼
┌─────────────────────────┐
│      PRACTICE           │
└──────┬──────────────────┘
       │
       ├─→ Retrieve Chunks ──→ Generate Questions
       │
       ├─→ User Answers ──→ Evaluate Response
       │
       ├─→ Score + Feedback ──→ Identify Weak Topics
       │
       └─→ Update Progress ──→ Store in SQLite
```

### Document Upload Flow


```
User uploads PDF
    |
    v
Extract text (pdf-parse)
    |
    v
Clean text (remove extra whitespace, fix encoding)
    |
    v
Store in /data/uploads/{docId}.txt
    |
    v
Create document record in SQLite
    |
    v
Return document ID to frontend
```

### Indexing Flow

```
User clicks "Generate Plan"
    |
    v
Load document text
    |
    v
Chunk text (1000 tokens, 150 overlap)
    |
    v
Generate embeddings (batch of 100 at a time)
    |
    v
Store chunks + embeddings in SQLite
    |
    v
Analyze document structure
    |
    v
Generate learning plan (Planner Agent)
    |
    v
Store plan in database
    |
    v
Return plan to frontend
```

### Teaching Flow

```
User selects a part
    |
    v
Build query from part title + objectives
    |
    v
Retrieve top-5 relevant chunks
    |
    v
Format chunks with citations
    |
    v
Send to Teacher Agent with context
    |
    v
Stream response to frontend
    |
    v
User asks follow-up question
    |
    v
Retrieve context for question
    |
    v
Stream answer
```

### Practice Flow

```
User switches to Practice tab
    |
    v
Retrieve chunks for current part
    |
    v
Generate questions (Practice Agent)
    |
    v
Display questions to user
    |
    v
User submits answer
    |
    v
Evaluate answer (Evaluator Agent)
    |
    v
Update progress (completed parts, weak topics)
    |
    v
Display feedback
```

---

## Database Schema

### Tables

**documents**
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,  -- 'pdf' or 'text'
  source_path TEXT,
  pages_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**chunks**
```sql
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  text TEXT NOT NULL,
  page_start INTEGER,
  page_end INTEGER,
  chunk_index INTEGER NOT NULL,
  embedding TEXT,  -- JSON array of floats
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
)
```

**learning_plans**
```sql
CREATE TABLE learning_plans (
  document_id TEXT PRIMARY KEY,
  plan_json TEXT NOT NULL,  -- JSON with outline and parts
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
)
```

**progress**
```sql
CREATE TABLE progress (
  document_id TEXT PRIMARY KEY,
  completed_parts TEXT DEFAULT '[]',  -- JSON array
  weak_topics TEXT DEFAULT '[]',      -- JSON array
  quiz_history TEXT DEFAULT '[]',     -- JSON array
  last_part_id TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id)
)
```

**settings**
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  encrypted INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## Security Architecture

### API Key Encryption

**Algorithm**: AES-256-CBC

**Key derivation**:
```javascript
const key = SHA256(hostname + username + "agentic-tutor-secret")
```

This makes the encryption key unique to your machine. Someone steals your database file? Useless without your specific machine.

**Storage**: Encrypted value stored in `settings` table.

### Data Isolation

- All data in local SQLite database
- No external API calls except to your chosen LLM provider
- No telemetry, no analytics, no tracking
- Documents stored in local `/data/uploads` folder
- Gitignored by default

---

## LLM Provider Abstraction

**Location**: `lib/llm/provider.ts`

### Why Abstract?

Different LLM providers have different APIs. OpenAI uses one format, Google uses another, Anthropic uses yet another. The abstraction layer handles these differences so the rest of the code doesn't care.

### Interface

```typescript
interface LLMProvider {
  chat(messages: Message[], stream: boolean): Promise<string> | AsyncIterableIterator<string>;
  embed(texts: string[]): Promise<number[][]>;
}
```

### Implementations

- **OpenAIProvider**: Uses OpenAI's chat completions and embeddings API
- **GeminiProvider**: Uses Google's generative AI API
- **ClaudeProvider**: Uses Anthropic's messages API

Each handles:
- Message format conversion
- Streaming response parsing
- Error handling
- Rate limiting

---

## Performance Considerations

### Chunking Strategy

**Chunk size**: 1000 tokens (~4000 characters)
**Overlap**: 150 tokens (~600 characters)

Why these numbers?
- 1000 tokens fits comfortably in most LLM context windows
- Large enough to contain meaningful context
- Small enough to be specific when retrieved
- 150 token overlap prevents context loss at boundaries

### Embedding Batch Size

**Default**: 100 chunks per batch

Why?
- Most embedding APIs have rate limits
- Batching reduces API calls
- 1-second delay between batches prevents rate limit errors

### Vector Search

**Algorithm**: Cosine similarity (in-memory)

Why not a vector database?
- For most documents (< 1000 pages), in-memory search is fast enough
- Simpler architecture
- No external dependencies
- SQLite stores the vectors, we just load them for search

**Performance**: ~10ms for 1000 chunks on average hardware

---

## Streaming Architecture

### Why Stream?

LLM responses can take 10-30 seconds to generate. Streaming shows progress and feels faster.

### Implementation

```typescript
// Server-side (Next.js API route)
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of llmStream) {
      controller.enqueue(encoder.encode(chunk));
    }
    controller.close();
  }
});

return new Response(stream, {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' }
});
```

```typescript
// Client-side (React component)
const response = await fetch('/api/teach', { method: 'POST', body: ... });
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  setContent(prev => prev + chunk);
}
```

---

## Error Handling

### API Errors

- Invalid API key: Show clear message to check settings
- Rate limit: Retry with exponential backoff
- Network error: Show retry button
- Invalid response: Log error, show generic message

### Document Processing Errors

- Invalid PDF: Show error, suggest text paste
- Empty document: Warn user before indexing
- Chunking failure: Fall back to simple character-based chunking

### Database Errors

- Initialization failure: Create database on first run
- Write failure: Show error, suggest checking disk space
- Read failure: Return empty results, log error

---

## Scalability Limits

### Current Limitations

- **Document size**: Tested up to 500 pages (~200k words)
- **Concurrent users**: Single-user application (local only)
- **Vector search**: In-memory, limited by RAM
- **Database size**: SQLite handles up to ~1TB, but performance degrades

### When You'd Need to Scale

- Multi-user deployment: Switch to PostgreSQL + pgvector
- Huge documents (1000+ pages): Use proper vector database (Pinecone, Weaviate)
- High concurrency: Deploy as web service with Redis caching

For personal use, current architecture is fine.

---

## Future Improvements

### Phase 7 (In Progress)

- Response caching (avoid re-generating same content)
- PDF viewer integration (see source while learning)
- Enhanced citation display (click to jump to page)
- Cost estimation (show API cost before indexing)

### Potential Enhancements

- Spaced repetition scheduling
- Collaborative learning (share plans)
- Mobile app
- Offline mode (local LLM support)
- Export to Anki/Notion

---

**Questions about the architecture? Check the [API Reference](./api-reference.md) or [Development Guide](./development.md).**
