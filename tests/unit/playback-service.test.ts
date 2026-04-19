import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { CatalogRepository } from '../../src/modules/catalog/catalog-repository';
import { PlaybackRepository } from '../../src/modules/playback/playback-repository';
import { PlaybackService } from '../../src/modules/playback/playback-service';
import { DatabaseManager } from '../../src/platform/database/database-manager';

describe('PlaybackService', () => {
  let database: DatabaseManager;
  let playbackService: PlaybackService;
  let tempDir: string;
  let videoId: number;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coursewatcher-playback-'));
    fs.writeFileSync(path.join(tempDir, '01. Test Video.mp4'), '');

    database = new DatabaseManager(tempDir).initialize();
    const catalogRepository = new CatalogRepository(database);
    catalogRepository.scanVideos();
    playbackService = new PlaybackService(new PlaybackRepository(database), catalogRepository);
    videoId = database.get<{ id: number }>('SELECT id FROM videos LIMIT 1')!.id;
  });

  afterEach(() => {
    database.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('marks long videos as in progress and completed', () => {
    expect(playbackService.updatePosition(videoId, 60, 600).video.status).toBe('in-progress');
    expect(playbackService.updatePosition(videoId, 540, 600).video.status).toBe('completed');
  });

  test('keeps completed videos reopened from the beginning', () => {
    playbackService.updatePosition(videoId, 540, 600);
    const video = database.get<any>('SELECT * FROM videos WHERE id = ?', [videoId]);
    expect(playbackService.getPlaybackStartPosition(video)).toBe(0);
  });

  test('does not keep partial progress for short videos', () => {
    const response = playbackService.updatePosition(videoId, 30, 240);
    expect(response.video.position).toBe(0);
    expect(response.video.status).toBe('in-progress');
  });
});
