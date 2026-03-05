# MeroStudySathy Requirements

## System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Operating System**: Windows, macOS, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for application + space for your documents

## API Requirements

You need an API key from at least one of these providers:

### OpenAI
- Sign up at: https://platform.openai.com/
- Get API key from: https://platform.openai.com/api-keys
- Recommended models:
  - `gpt-4-turbo-preview` (best quality)
  - `gpt-3.5-turbo` (faster, cheaper)
- Embedding model: `text-embedding-3-small`

### Google AI (Gemini)
- Sign up at: https://makersuite.google.com/
- Get API key from: https://makersuite.google.com/app/apikey
- Recommended models:
  - `gemini-1.5-pro` (best quality)
  - `gemini-pro` (faster)
- Embedding model: `embedding-001`

### Anthropic (Claude)
- Sign up at: https://console.anthropic.com/
- Get API key from account settings
- Recommended models:
  - `claude-3-opus-20240229` (best quality)
  - `claude-3-sonnet-20240229` (balanced)
  - `claude-3-haiku-20240307` (fastest, cheapest)

## Node.js Dependencies

All dependencies are listed in `package.json` and installed via `npm install`:

### Core Framework
```
next@14.2.35
react@18.3.1
react-dom@18.3.1
typescript@5.7.3
```

### UI & Styling
```
tailwindcss@3.4.17
@radix-ui/react-*  (various UI components)
class-variance-authority@0.7.1
clsx@2.1.1
lucide-react@0.468.0
```

### Database & Storage
```
better-sqlite3@11.8.1
```

### PDF Processing
```
pdf-parse@1.1.1
react-pdf@7.7.0
pdfjs-dist@3.11.174
```

### Utilities
```
next-themes@0.4.4
sonner@1.7.1
```

### Development
```
@types/node@22.10.5
@types/react@18.3.18
@types/react-dom@18.3.5
eslint@9.18.0
eslint-config-next@14.2.35
```

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/parnish007/merostudysathy.git
cd merostudysathy
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

## Production Build

```bash
npm run build
npm start
```

## Environment Variables (Optional)

You can optionally create a `.env.local` file for development:

```bash
# Not required - settings stored in SQLite
# But useful for testing without UI
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
```

Note: The application stores API keys encrypted in the local database. Environment variables are only needed for development/testing.

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### PDF parsing fails
Some PDFs are scanned images. Use OCR first or paste text manually.

### Database locked errors
Close other connections to the database. SQLite allows only one writer at a time.

### High memory usage
Large PDFs (500+ pages) can use significant RAM during indexing. Close other applications if needed.

## Cost Estimates

Typical API costs for a 100-page PDF:

**OpenAI (GPT-4)**
- Indexing: $0.50
- Plan generation: $0.15
- 10 teaching sessions: $0.30
- 5 practice sessions: $0.20
- **Total**: ~$1.15

**OpenAI (GPT-3.5)**
- Indexing: $0.05
- Plan generation: $0.02
- 10 teaching sessions: $0.05
- 5 practice sessions: $0.03
- **Total**: ~$0.15

**Google Gemini Pro**
- Indexing: $0.00 (free embeddings)
- Plan generation: $0.02
- 10 teaching sessions: $0.05
- 5 practice sessions: $0.03
- **Total**: ~$0.10

Costs are estimates and vary based on document complexity and usage patterns. Response caching reduces costs by 60-80% for repeated queries.
