import db from "./localDb";

export function getSavedLesson(
    docId: string,
    partId: string,
    mode: string = "simple"
): string | null {
    const stmt = db.prepare(
        "SELECT content FROM lesson_content WHERE document_id = ? AND part_id = ? AND mode = ?"
    );
    const row = stmt.get(docId, partId, mode) as { content: string } | undefined;
    return row?.content || null;
}

export function saveLesson(
    docId: string,
    partId: string,
    mode: string,
    content: string
): void {
    const stmt = db.prepare(`
    INSERT INTO lesson_content (document_id, part_id, mode, content)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(document_id, part_id, mode) DO UPDATE SET
      content = excluded.content,
      updated_at = CURRENT_TIMESTAMP
  `);

    stmt.run(docId, partId, mode, content);
}
