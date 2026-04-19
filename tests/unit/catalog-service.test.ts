import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { CatalogRepository } from '../../src/modules/catalog/catalog-repository';
import { CatalogService } from '../../src/modules/catalog/catalog-service';
import { NotesRepository } from '../../src/modules/notes/notes-repository';
import { NotesService } from '../../src/modules/notes/notes-service';
import { PlaybackRepository } from '../../src/modules/playback/playback-repository';
import { PlaybackService } from '../../src/modules/playback/playback-service';
import { DatabaseManager } from '../../src/platform/database/database-manager';

describe('CatalogService', () => {
  let catalogService: CatalogService;
  let database: DatabaseManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coursewatcher-catalog-'));
    fs.mkdirSync(path.join(tempDir, '01. Intro'));
    fs.writeFileSync(path.join(tempDir, '01. Intro', '01. Welcome.mp4'), '');
    fs.writeFileSync(path.join(tempDir, '01. Intro', '02. Setup.mp4'), '');
    fs.writeFileSync(path.join(tempDir, '03. Root Video.mp4'), '');

    database = new DatabaseManager(tempDir).initialize();

    const catalogRepository = new CatalogRepository(database);
    const notesService = new NotesService(new NotesRepository(database));
    const playbackService = new PlaybackService(new PlaybackRepository(database), catalogRepository);
    catalogService = new CatalogService(catalogRepository, playbackService, notesService);
    catalogService.scanVideos();
  });

  afterEach(() => {
    database.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('groups root videos and modules', () => {
    const catalog = catalogService.getCatalog('name');
    expect(catalog.modules).toHaveLength(2);
    expect(catalog.modules[0].name).toBe('Videos');
    expect(catalog.modules[1].name).toBe('01. Intro');
  });

  test('searches by video title', () => {
    const results = catalogService.searchVideos('Setup');
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('Setup');
  });
});
