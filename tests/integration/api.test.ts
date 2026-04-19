import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createCourseWatcherApp } from '../../src/app/server/create-app';
import { CatalogRepository } from '../../src/modules/catalog/catalog-repository';
import { DatabaseManager } from '../../src/platform/database/database-manager';

describe('CourseWatcher API', () => {
  let app: Awaited<ReturnType<typeof createCourseWatcherApp>>['app'];
  let database: DatabaseManager;
  let tempDir: string;
  let firstVideoId: number;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coursewatcher-api-'));
    fs.writeFileSync(path.join(tempDir, '01. Test Video.mp4'), '');
    fs.writeFileSync(path.join(tempDir, '02. Another Video.mp4'), '');

    database = new DatabaseManager(tempDir).initialize();
    const catalogRepository = new CatalogRepository(database);
    catalogRepository.scanVideos();

    firstVideoId = database.get<{ id: number }>('SELECT id FROM videos ORDER BY id LIMIT 1')!.id;
    app = (await createCourseWatcherApp(database)).app;
  });

  afterEach(() => {
    database.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('returns course statistics and catalog payloads', async () => {
    const statsResponse = await request(app).get('/api/stats');
    const catalogResponse = await request(app).get('/api/catalog');

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.total).toBe(2);
    expect(catalogResponse.status).toBe(200);
    expect(catalogResponse.body.modules).toHaveLength(1);
  });

  test('returns player payload with computed start position', async () => {
    database.run(
      'UPDATE videos SET position = ?, duration = ?, status = ? WHERE id = ?',
      [120, 600, 'in-progress', firstVideoId],
    );

    const response = await request(app).get(`/api/videos/${firstVideoId}`);

    expect(response.status).toBe(200);
    expect(response.body.startPosition).toBe(120);
  });

  test('updates progress, status, and notes', async () => {
    const progressResponse = await request(app)
      .post(`/api/videos/${firstVideoId}/progress`)
      .send({ position: 540, duration: 600 });

    const statusResponse = await request(app)
      .post(`/api/videos/${firstVideoId}/status`)
      .send({ status: 'unwatched' });

    const notesResponse = await request(app)
      .post(`/api/videos/${firstVideoId}/notes`)
      .send({ content: '# Notes' });

    expect(progressResponse.body.video.status).toBe('completed');
    expect(statusResponse.body.video.position).toBe(0);
    expect(notesResponse.body.notes.content).toContain('Notes');
  });

  test('serves the SPA shell for app routes', async () => {
    const response = await request(app).get('/video/1');
    expect(response.status).toBe(200);
    expect(response.text).toContain('<div id="root"></div>');
  });
});
