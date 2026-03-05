import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "tutor.db");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

// Initialize schema
export function initializeDatabase() {
    // Settings table
    db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      encrypted INTEGER DEFAULT 1,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Documents table
    db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source_type TEXT NOT NULL, -- 'pdf' | 'text'
      source_path TEXT,
      pages_count INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Chunks table
    db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      text TEXT NOT NULL,
      page_start INTEGER,
      page_end INTEGER,
      chunk_index INTEGER NOT NULL,
      embedding TEXT, -- JSON array of floats
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chunks_document
    ON chunks(document_id);
  `);

    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chunks_pages
    ON chunks(page_start, page_end);
  `);

    // Outlines table
    db.exec(`
    CREATE TABLE IF NOT EXISTS outlines (
      document_id TEXT PRIMARY KEY,
      outline_json TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

    // Learning plans table
    db.exec(`
    CREATE TABLE IF NOT EXISTS learning_plans (
      document_id TEXT PRIMARY KEY,
      plan_json TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

    // Progress table
    db.exec(`
    CREATE TABLE IF NOT EXISTS progress (
      document_id TEXT PRIMARY KEY,
      completed_parts TEXT, -- JSON array
      weak_topics TEXT,     -- JSON array
      quiz_history TEXT,    -- JSON array
      last_part_id TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

    // Persistent lesson cache for each generated part
    db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_content (
      document_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'simple',
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (document_id, part_id, mode),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_lesson_document
    ON lesson_content(document_id)
  `);

    console.log("Database initialized successfully");
}

// Initialize on module load
initializeDatabase();

export default db;
