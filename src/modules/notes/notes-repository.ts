import type { DatabaseManager, NoteRow } from '../../platform/database/database-manager';

export class NotesRepository {
  constructor(private readonly database: DatabaseManager) {}

  findVideo(videoId: number): { id: number } | undefined {
    return this.database.get<{ id: number }>('SELECT id FROM videos WHERE id = ?', [videoId]);
  }

  findNotes(videoId: number): NoteRow | undefined {
    return this.database.get<NoteRow>('SELECT * FROM notes WHERE video_id = ?', [videoId]);
  }

  saveNotes(videoId: number, content: string): void {
    this.database.run(
      `
        INSERT INTO notes (video_id, content, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(video_id) DO UPDATE SET
          content = excluded.content,
          updated_at = CURRENT_TIMESTAMP
      `,
      [videoId, content],
    );
  }
}
