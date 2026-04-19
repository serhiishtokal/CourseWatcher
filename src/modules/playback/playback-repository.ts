import type { DatabaseManager, VideoRow } from '../../platform/database/database-manager';

export class PlaybackRepository {
  constructor(private readonly database: DatabaseManager) {}

  findVideo(videoId: number): VideoRow | undefined {
    return this.database.get<VideoRow>('SELECT * FROM videos WHERE id = ?', [videoId]);
  }

  updateVideo(videoId: number, position: number, duration: number | null, status: VideoRow['status']): void {
    this.database.run(
      `
        UPDATE videos
        SET position = ?,
            duration = COALESCE(?, duration),
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [position, duration, status, videoId],
    );
  }

  updateVideoStatus(videoId: number, status: VideoRow['status'], position: number): void {
    this.database.run(
      `
        UPDATE videos
        SET status = ?,
            position = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [status, position, videoId],
    );
  }
}
