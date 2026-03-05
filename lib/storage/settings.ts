import crypto from "crypto";
import os from "os";
import db from "./localDb";

// Generate encryption key from machine-specific data
const ENCRYPTION_KEY = crypto
    .createHash("sha256")
    .update(os.hostname() + os.userInfo().username + "agentic-tutor-secret")
    .digest();

const ALGORITHM = "aes-256-cbc";

/**
 * Encrypt a string value
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypt a string value
 */
export function decrypt(encryptedText: string): string {
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}

export interface Settings {
    provider: "openai" | "gemini" | "claude";
    apiKey: string;
    model: string;
    embeddingModel?: string;
}

/**
 * Get a setting value
 */
export function getSetting(key: string): string | null {
    const stmt = db.prepare("SELECT value, encrypted FROM settings WHERE key = ?");
    const row = stmt.get(key) as { value: string; encrypted: number } | undefined;

    if (!row) return null;

    return row.encrypted ? decrypt(row.value) : row.value;
}

/**
 * Set a setting value
 */
export function setSetting(key: string, value: string, encrypted = true): void {
    const finalValue = encrypted ? encrypt(value) : value;

    const stmt = db.prepare(`
    INSERT INTO settings (key, value, encrypted, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      encrypted = excluded.encrypted,
      updated_at = CURRENT_TIMESTAMP
  `);

    stmt.run(key, finalValue, encrypted ? 1 : 0);
}

/**
 * Delete a setting
 */
export function deleteSetting(key: string): void {
    const stmt = db.prepare("DELETE FROM settings WHERE key = ?");
    stmt.run(key);
}

/**
 * Get all settings (decrypted)
 */
export function getAllSettings(): Record<string, string> {
    const stmt = db.prepare("SELECT key, value, encrypted FROM settings");
    const rows = stmt.all() as Array<{ key: string; value: string; encrypted: number }>;

    const settings: Record<string, string> = {};
    for (const row of rows) {
        settings[row.key] = row.encrypted ? decrypt(row.value) : row.value;
    }

    return settings;
}

/**
 * Get user settings for LLM provider
 */
export function getUserSettings(): Settings | null {
    const provider = getSetting("provider") as Settings["provider"] | null;
    const apiKey = getSetting("apiKey");
    const model = getSetting("model");

    if (!provider || !apiKey || !model) {
        return null;
    }

    return {
        provider,
        apiKey,
        model,
        embeddingModel: getSetting("embeddingModel") || undefined,
    };
}

/**
 * Save user settings
 */
export function saveUserSettings(settings: Settings): void {
    setSetting("provider", settings.provider, false);
    setSetting("apiKey", settings.apiKey, true); // Encrypt API key
    setSetting("model", settings.model, false);
    if (settings.embeddingModel) {
        setSetting("embeddingModel", settings.embeddingModel, false);
    }
}

/**
 * Clear all API keys (for security)
 */
export function clearApiKeys(): void {
    deleteSetting("apiKey");
}
