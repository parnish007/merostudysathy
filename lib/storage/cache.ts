/**
 * Response Caching Layer
 * Caches LLM responses to reduce API costs
 */

import db from "../storage/localDb";
import crypto from "crypto";

export interface CacheEntry {
    key: string;
    response: string;
    createdAt: number;
    expiresAt: number;
}

/**
 * Generate cache key from request parameters
 */
function generateCacheKey(
    type: string,
    docId: string,
    params: Record<string, any>
): string {
    const data = JSON.stringify({ type, docId, params });
    return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Initialize cache table
 */
export function initializeCache() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS response_cache (
      key TEXT PRIMARY KEY,
      response TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

    // Create index for expiration cleanup
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_cache_expires 
    ON response_cache(expires_at)
  `);
}

/**
 * Get cached response
 */
export function getCachedResponse(
    type: string,
    docId: string,
    params: Record<string, any>
): string | null {
    const key = generateCacheKey(type, docId, params);
    const now = Date.now();

    const stmt = db.prepare(`
    SELECT response FROM response_cache 
    WHERE key = ? AND expires_at > ?
  `);

    const row = stmt.get(key, now) as { response: string } | undefined;

    if (row) {
        console.log(`Cache hit for ${type}`);
        return row.response;
    }

    console.log(`Cache miss for ${type}`);
    return null;
}

/**
 * Store response in cache
 */
export function setCachedResponse(
    type: string,
    docId: string,
    params: Record<string, any>,
    response: string,
    ttlMinutes: number = 60
): void {
    const key = generateCacheKey(type, docId, params);
    const now = Date.now();
    const expiresAt = now + ttlMinutes * 60 * 1000;

    const stmt = db.prepare(`
    INSERT OR REPLACE INTO response_cache (key, response, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `);

    stmt.run(key, response, now, expiresAt);
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): number {
    const now = Date.now();

    const stmt = db.prepare(`
    DELETE FROM response_cache WHERE expires_at <= ?
  `);

    const result = stmt.run(now);
    return result.changes;
}

/**
 * Clear all cache for a document
 */
export function clearDocumentCache(docId: string): number {
    // This is a simple approach - delete all cache entries
    // In production, you'd want to track docId in cache entries
    const stmt = db.prepare(`
    DELETE FROM response_cache 
    WHERE key LIKE ?
  `);

    const result = stmt.run(`%${docId}%`);
    return result.changes;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    totalSize: number;
} {
    const now = Date.now();

    const totalStmt = db.prepare("SELECT COUNT(*) as count FROM response_cache");
    const total = (totalStmt.get() as { count: number }).count;

    const expiredStmt = db.prepare(
        "SELECT COUNT(*) as count FROM response_cache WHERE expires_at <= ?"
    );
    const expired = (expiredStmt.get(now) as { count: number }).count;

    const sizeStmt = db.prepare(
        "SELECT SUM(LENGTH(response)) as size FROM response_cache"
    );
    const size = (sizeStmt.get() as { size: number | null }).size || 0;

    return {
        totalEntries: total,
        expiredEntries: expired,
        totalSize: size,
    };
}

// Initialize cache table on import
initializeCache();

// Clean up expired entries every hour
setInterval(() => {
    const deleted = clearExpiredCache();
    if (deleted > 0) {
        console.log(`Cleaned up ${deleted} expired cache entries`);
    }
}, 60 * 60 * 1000);
