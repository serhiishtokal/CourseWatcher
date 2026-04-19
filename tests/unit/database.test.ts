import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { DatabaseManager } from '../../src/platform/database/database-manager';

describe('DatabaseManager', () => {
  let database: DatabaseManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coursewatcher-db-'));
    database = new DatabaseManager(tempDir).initialize();
  });

  afterEach(() => {
    database.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('creates the .coursewatcher folder and database file', () => {
    expect(fs.existsSync(path.join(tempDir, '.coursewatcher'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, '.coursewatcher', 'database.sqlite'))).toBe(true);
  });

  test('supports transactions', () => {
    database.transaction(() => {
      database.run('INSERT INTO modules (name, path) VALUES (?, ?)', ['Module', path.join(tempDir, 'module')]);
    });

    const moduleRow = database.get<{ name: string }>('SELECT name FROM modules LIMIT 1');
    expect(moduleRow?.name).toBe('Module');
  });
});
