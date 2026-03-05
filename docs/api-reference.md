# API Reference

Complete reference for all API endpoints in MeroStudySathy.

---

## Base URL

All API routes are relative to your Next.js app:
```
http://localhost:3000/api
```

---

## Authentication

None. Everything runs locally. API keys are stored encrypted in your local database.

---

## Endpoints

### Settings

#### Get Settings
```http
GET /api/settings
```

**Response**:
```json
{
  "provider": "openai",
  "model": "gpt-4-turbo-preview",
  "embeddingModel": "text-embedding-3-small"
}
```

Note: API key is never returned (security).

#### Save Settings
```http
POST /api/settings
Content-Type: application/json

{
  "provider": "openai",
  "apiKey": "sk-...",
  "model": "gpt-4-turbo-preview",
  "embeddingModel": "text-embedding-3-small"
}
```

**Response**:
```json
{
  "success": true
}
```

#### Delete Settings
```http
DELETE /api/settings
```

**Response**:
```json
{
  "success": true
}
```

---

### Documents

#### List Documents
```http
GET /api/docs
```

**Response**:
```json
{
  "documents": [
    {
      "id": "doc-abc123",
      "title": "Machine Learning Basics",
      "source_type": "pdf",
      "pages_count": 150,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Upload Document
```http
POST /api/docs/upload
Content-Type: multipart/form-data

file: <PDF file>
title: "Document Title"
```

OR

```http
POST /api/docs/upload
Content-Type: application/json

{
  "text": "Your text content here...",
  "title": "Document Title"
}
```

**Response**:
```json
{
  "document": {
    "id": "doc-abc123",
    "title": "Document Title",
    "source_type": "pdf",
    "pages_count": 150
  },
  "success": true
}
```

#### Delete Document
```http
DELETE /api/docs/{id}
```

**Response**:
```json
{
  "success": true
}
```

---

### Document Indexing

#### Index Document
```http
POST /api/docs/{id}/index
```

Creates chunks, generates embeddings, and stores in vector database.

**Response**:
```json
{
  "success": true,
  "chunksCreated": 245,
  "message": "Document indexed successfully"
}
```

**Note**: This can take 1-5 minutes depending on document size.

---

### Learning Plans

#### Get Learning Plan
```http
GET /api/docs/{id}/plan
```

**Response**:
```json
{
  "plan": {
    "outline": {
      "title": "Machine Learning Basics",
      "chapters": [
        {
          "title": "Introduction",
          "topics": ["Overview", "History"]
        }
      ]
    },
    "parts": [
      {
        "id": "part-1",
        "title": "What is Machine Learning?",
        "objectives": [
          "Understand the definition of ML",
          "Identify types of ML"
        ],
        "estimatedMinutes": 20,
        "prerequisites": [],
        "topics": ["Supervised Learning", "Unsupervised Learning"]
      }
    ]
  }
}
```

#### Generate Learning Plan
```http
POST /api/docs/{id}/plan
```

Uses AI to analyze document and create structured learning plan.

**Response**: Same as GET (returns generated plan)

**Note**: Requires settings to be configured first.

---

### Teaching

#### Get Teaching Content
```http
POST /api/teach
Content-Type: application/json

{
  "docId": "doc-abc123",
  "partId": "part-1",
  "mode": "simple",
  "message": null,
  "conversationHistory": []
}
```

**Parameters**:
- `docId`: Document ID
- `partId`: Learning part ID
- `mode`: Teaching mode ("simple", "detailed", or "examples")
- `message`: User's question (null for initial teaching)
- `conversationHistory`: Array of previous messages

**Response**: Streaming text

**Example**:
```
# What is Machine Learning?

## 1. Definition
Machine learning is a subset of artificial intelligence...

[Source 1, Page 5] According to the textbook...
```

#### Ask Follow-up Question
```http
POST /api/teach
Content-Type: application/json

{
  "docId": "doc-abc123",
  "partId": "part-1",
  "message": "Can you explain supervised learning in more detail?",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response**: Streaming text with answer

---

### Practice

#### Generate Practice Questions
```http
POST /api/practice
Content-Type: application/json

{
  "docId": "doc-abc123",
  "partId": "part-1",
  "count": 5
}
```

**Response**:
```json
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "What is the primary goal of supervised learning?",
      "options": [
        "To learn from labeled data",
        "To cluster similar items",
        "To reduce dimensionality",
        "To generate new data"
      ],
      "correctAnswer": "To learn from labeled data",
      "explanation": "Supervised learning uses labeled data...",
      "sourceChunks": ["chunk-5", "chunk-12"]
    },
    {
      "id": "q2",
      "type": "short",
      "question": "Explain the difference between classification and regression.",
      "answer": "Classification predicts categories, regression predicts continuous values",
      "explanation": "A good answer should mention...",
      "sourceChunks": ["chunk-8"]
    }
  ],
  "success": true
}
```

---

### Evaluation

#### Evaluate Answer
```http
POST /api/evaluate
Content-Type: application/json

{
  "docId": "doc-abc123",
  "partId": "part-1",
  "question": {
    "id": "q1",
    "type": "short",
    "question": "What is supervised learning?",
    "answer": "Learning from labeled data"
  },
  "userAnswer": "It's when you train a model using data that has labels"
}
```

**Response**:
```json
{
  "evaluation": {
    "score": 85,
    "correctness": 90,
    "completeness": 80,
    "clarity": 85,
    "feedback": "Good answer! You correctly identified that supervised learning uses labeled data. You could improve by mentioning that the model learns to map inputs to outputs.",
    "corrections": [],
    "strengths": [
      "Correct core concept",
      "Clear explanation"
    ],
    "improvements": [
      "Add more detail about the learning process",
      "Mention examples like classification or regression"
    ],
    "revisionTopics": []
  },
  "success": true
}
```

**Note**: Also updates progress tracking automatically.

---

### Progress

#### Get Progress
```http
GET /api/docs/{id}/progress
```

**Response**:
```json
{
  "completedParts": ["part-1", "part-2"],
  "weakTopics": [
    "Review gradient descent (Page 45)",
    "Practice backpropagation examples"
  ],
  "quizHistory": [
    {
      "partId": "part-1",
      "score": 85,
      "timestamp": "2024-01-15T14:30:00Z"
    }
  ],
  "totalParts": 10,
  "completionPercentage": 20
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

**Common HTTP Status Codes**:
- `400`: Bad request (missing parameters, invalid data)
- `404`: Resource not found
- `500`: Server error (LLM API failure, database error, etc.)

---

## Rate Limiting

No rate limiting on the API itself (it's local). However, your LLM provider has rate limits. Check their documentation:
- OpenAI: https://platform.openai.com/docs/guides/rate-limits
- Google: https://ai.google.dev/pricing
- Anthropic: https://docs.anthropic.com/claude/reference/rate-limits

---

## Streaming Responses

Teaching endpoint uses Server-Sent Events for streaming:

```javascript
const response = await fetch('/api/teach', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ docId, partId, message: null })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk); // Display incrementally
}
```

---

## Data Types

### Message
```typescript
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}
```

### Document
```typescript
interface Document {
  id: string;
  title: string;
  source_type: "pdf" | "text";
  source_path?: string;
  pages_count?: number;
  created_at: string;
}
```

### LearningPlan
```typescript
interface LearningPlan {
  outline: {
    title: string;
    chapters: Array<{
      title: string;
      topics: string[];
    }>;
  };
  parts: Part[];
}

interface Part {
  id: string;
  title: string;
  objectives: string[];
  estimatedMinutes: number;
  prerequisites: string[];
  topics: string[];
}
```

### Question
```typescript
interface Question {
  id: string;
  type: "mcq" | "short" | "why";
  question: string;
  options?: string[];        // For MCQs
  correctAnswer?: string;    // For MCQs
  answer?: string;           // For short/why
  explanation: string;
  sourceChunks: string[];
}
```

### Evaluation
```typescript
interface Evaluation {
  score: number;           // 0-100
  correctness: number;     // 0-100
  completeness: number;    // 0-100
  clarity: number;         // 0-100
  feedback: string;
  corrections: string[];
  strengths: string[];
  improvements: string[];
  revisionTopics: string[];
}
```

---

**For implementation details, see [Architecture](./architecture.md) or [Development Guide](./development.md).**
