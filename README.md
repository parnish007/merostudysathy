# MeroStudySathy

Local-first AI tutor for PDFs and pasted text. Upload a document, generate a learning plan, study in chat mode, practice with generated questions, and track progress.

## Features

- Upload PDF files or paste raw text
- Extract and chunk content for retrieval
- Generate embeddings and store vectors in local SQLite
- Create AI learning plans per document
- Teach each plan section with streaming responses and citations
- Generate practice questions and evaluate answers
- Track completed parts, quiz history, and weak topics
- Store provider settings locally with encrypted API keys

## Tech stack

- Next.js 14 (App Router)
- TypeScript + React 18
- Tailwind CSS + shadcn/ui components
- SQLite (`better-sqlite3`) for local storage
- `pdf-parse` for PDF extraction
- OpenAI / Gemini / Claude via provider abstraction

## Quick start

### 1. Install

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### 3. Configure your LLM provider

Go to `/settings` and set:

- provider: `openai` | `gemini` | `claude`
- model: your chat model name
- api key

The API key is encrypted before local storage.
After saving, the UI intentionally shows a masked value (for example `sk-1***9x2`) instead of the raw key.

### 4. First learning flow

1. Upload a PDF or paste text on the home page.
2. Open the document page (`/doc/[id]`).
3. Click **Generate Plan**.
4. Select a plan part and start learning in chat.
5. Use practice/evaluation to update progress.

## Scripts

```bash
npm run dev    # start dev server
npm run lint   # run Next.js ESLint
npm run build  # production build
npm run start  # run production server
```

## Project structure

```txt
app/
  api/
    docs/
    evaluate/
    plan/
    practice/
    settings/
    teach/
  doc/[id]/
  settings/
components/
lib/
  agents/
  llm/
  pdf/
  rag/
  storage/
docs/
data/          # local runtime data (gitignored)
```

## API routes (implemented)

- `GET /api/settings`
- `POST /api/settings`
- `DELETE /api/settings`
- `GET /api/docs`
- `POST /api/docs/upload`
- `POST /api/docs/[id]/index`
- `GET /api/docs/[id]/plan`
- `POST /api/docs/[id]/plan`
- `GET /api/docs/[id]/progress`
- `POST /api/teach` (streaming)
- `POST /api/practice`
- `POST /api/evaluate`
- `POST /api/plan`

## Local data and privacy

- Database: `data/tutor.db`
- Uploaded files and extracted text: `data/uploads/`
- API keys: encrypted at rest in `settings` table

No telemetry or external backend is used by this project. External requests are only made to your selected LLM provider APIs.

## Troubleshooting

- Upload fails with `Failed to upload document`:
  - Make sure the file is a real PDF (`.pdf` extension).
  - Check terminal logs from `npm run dev` for parser errors.
- Settings save fails:
  - Ensure both `provider` and `model` are set.
  - API key is required the first time; after that it can be left blank to keep existing.
- "Why can't I see my API key after save?":
  - This is expected for security. The app stores an encrypted key and only shows a masked preview.

## Documentation

- `docs/architecture.md`
- `docs/api-reference.md`
- `docs/development.md`

## License

MIT
