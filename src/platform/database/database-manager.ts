import fs from 'node:fs';
import Database from 'better-sqlite3';
import { getDataFolder, getDbPath } from '../config/app-config';
import { DatabaseError } from '../errors/app-error';

export interface ModuleRow {
  id: number;
  name: string;
  path: string;
  sort_order: number;
  created_at: string;
}

export interface VideoRow {
  id: number;
  path: string;
  filename: string;
  title: string;
  duration: number;
  position: number;
  status: 'unwatched' | 'in-progress' | 'completed';
  module_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NoteRow {
  id?: number;
  video_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export class DatabaseManager {
  private readonly coursePath: string;
  private db: Database.Database | null = null;

  constructor(coursePath: string) {
    this.coursePath = coursePath;
  }

  initialize(): this {
    try {
      const dataFolder = getDataFolder(this.coursePath);
      if (!fs.existsSync(dataFolder)) {
        fs.mkdirSync(dataFolder, { recursive: true });
      }

      this.db = new Database(getDbPath(this.coursePath));
      this.db.pragma('foreign_keys = ON');
      this.createSchema();

      return this;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown error';
      throw new DatabaseError(`Failed to initialize database: ${message}`);
    }
  }

  getCoursePath(): string {
    return this.coursePath;
  }

  get<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.requireDb().prepare(sql).get(...params) as T | undefined;
  }

  all<T>(sql: string, params: unknown[] = []): T[] {
    return this.requireDb().prepare(sql).all(...params) as T[];
  }

  run(sql: string, params: unknown[] = []): Database.RunResult {
    return this.requireDb().prepare(sql).run(...params);
  }

  transaction<T>(callback: () => T): T {
    return this.requireDb().transaction(callback)();
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private requireDb(): Database.Database {
    if (!this.db) {
      throw new DatabaseError('Database is not initialized');
    }

    return this.db;
  }

  private createSchema(): void {
    const db = this.requireDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        title TEXT NOT NULL,
        duration REAL DEFAULT 0,
        position REAL DEFAULT 0,
        status TEXT CHECK(status IN ('unwatched', 'in-progress', 'completed')) DEFAULT 'unwatched',
        module_id INTEGER,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER NOT NULL UNIQUE,
        content TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_videos_module ON videos(module_id);
      CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
      CREATE INDEX IF NOT EXISTS idx_videos_path ON videos(path);
    `);
  }
}
