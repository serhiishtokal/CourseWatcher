import fs from 'node:fs';
import path from 'node:path';
import type { CatalogSort } from '../../shared/contracts/api';
import type { DatabaseManager, ModuleRow, VideoRow } from '../../platform/database/database-manager';
import { appConfig } from '../../platform/config/app-config';

interface DiscoveredVideo {
  filename: string;
  moduleName: string;
  modulePath: string;
  path: string;
  sortOrder: number;
  title: string;
}

export class CatalogRepository {
  constructor(private readonly database: DatabaseManager) {}

  scanVideos(): { added: number; existing: number; total: number } {
    const coursePath = this.database.getCoursePath();
    const videos = this.findVideoFiles(coursePath);

    let added = 0;
    let existing = 0;

    this.database.transaction(() => {
      for (const video of videos) {
        const current = this.database.get<{ id: number }>(
          'SELECT id FROM videos WHERE path = ?',
          [video.path],
        );

        if (current) {
          this.database.run('UPDATE videos SET title = ? WHERE id = ?', [video.title, current.id]);
          existing += 1;
          continue;
        }

        const moduleId = this.getOrCreateModule(video.modulePath, video.moduleName);
        this.database.run(
          `
            INSERT INTO videos (path, filename, title, module_id, sort_order)
            VALUES (?, ?, ?, ?, ?)
          `,
          [video.path, video.filename, video.title, moduleId, video.sortOrder],
        );
        added += 1;
      }
    });

    return {
      total: videos.length,
      added,
      existing,
    };
  }

  findVideoById(videoId: number): VideoRow | undefined {
    return this.database.get<VideoRow>('SELECT * FROM videos WHERE id = ?', [videoId]);
  }

  findModuleName(moduleId: number | null): string | null {
    if (moduleId === null) {
      return null;
    }

    return this.database.get<{ name: string }>('SELECT name FROM modules WHERE id = ?', [moduleId])?.name ?? null;
  }

  listModules(): ModuleRow[] {
    return this.database.all<ModuleRow>('SELECT * FROM modules ORDER BY sort_order, name');
  }

  listVideosForModule(moduleId: number | null, sortBy: CatalogSort): VideoRow[] {
    const orderBy = this.getVideoOrderBy(sortBy);
    if (moduleId === null) {
      return this.database.all<VideoRow>(`SELECT * FROM videos WHERE module_id IS NULL ${orderBy}`);
    }

    return this.database.all<VideoRow>(
      `SELECT * FROM videos WHERE module_id = ? ${orderBy}`,
      [moduleId],
    );
  }

  searchVideos(query: string): Array<VideoRow & { module_name: string | null }> {
    const searchTerm = `%${query}%`;
    return this.database.all<VideoRow & { module_name: string | null }>(
      `
        SELECT v.*, m.name AS module_name
        FROM videos v
        LEFT JOIN modules m ON v.module_id = m.id
        WHERE v.title LIKE ? OR v.filename LIKE ?
        ORDER BY v.sort_order, v.filename
      `,
      [searchTerm, searchTerm],
    );
  }

  getStatsCounts(): { completed: number; inProgress: number; total: number } {
    const total = this.database.get<{ count: number }>('SELECT COUNT(*) AS count FROM videos')?.count ?? 0;
    const completed =
      this.database.get<{ count: number }>(
        "SELECT COUNT(*) AS count FROM videos WHERE status = 'completed'",
      )?.count ?? 0;
    const inProgress =
      this.database.get<{ count: number }>(
        "SELECT COUNT(*) AS count FROM videos WHERE status = 'in-progress'",
      )?.count ?? 0;

    return {
      total,
      completed,
      inProgress,
    };
  }

  listAdjacentVideoIds(video: VideoRow): { next: number | null; prev: number | null } {
    const videos = video.module_id === null
      ? this.database.all<{ id: number }>(
          'SELECT id FROM videos WHERE module_id IS NULL ORDER BY sort_order, filename',
        )
      : this.database.all<{ id: number }>(
          'SELECT id FROM videos WHERE module_id = ? ORDER BY sort_order, filename',
          [video.module_id],
        );

    const currentIndex = videos.findIndex(({ id }) => id === video.id);

    return {
      prev: currentIndex > 0 ? videos[currentIndex - 1].id : null,
      next: currentIndex >= 0 && currentIndex < videos.length - 1 ? videos[currentIndex + 1].id : null,
    };
  }

  listQueueVideos(video: VideoRow): VideoRow[] {
    if (video.module_id === null) {
      return this.database.all<VideoRow>(
        'SELECT * FROM videos WHERE module_id IS NULL ORDER BY sort_order, filename',
      );
    }

    return this.database.all<VideoRow>(
      'SELECT * FROM videos WHERE module_id = ? ORDER BY sort_order, filename',
      [video.module_id],
    );
  }

  private findVideoFiles(dir: string, relativeTo = dir): DiscoveredVideo[] {
    const videos: DiscoveredVideo[] = [];

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name === appConfig.dbFolder) {
          continue;
        }

        if (entry.isDirectory()) {
          videos.push(...this.findVideoFiles(fullPath, relativeTo));
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        const extension = path.extname(entry.name).toLowerCase();
        if (!appConfig.videoExtensions.includes(extension)) {
          continue;
        }

        const relativePath = path.relative(relativeTo, fullPath);
        const parts = relativePath.split(path.sep);
        const moduleName = parts.length > 1 ? parts[0] : 'Root';
        const modulePath = parts.length > 1 ? path.join(relativeTo, parts[0]) : relativeTo;

        videos.push({
          path: fullPath,
          filename: entry.name,
          title: this.extractTitle(entry.name),
          moduleName,
          modulePath,
          sortOrder: this.extractSortOrder(entry.name),
        });
      }
    } catch {
      return videos;
    }

    return videos.sort((left, right) => left.sortOrder - right.sortOrder);
  }

  private extractTitle(filename: string): string {
    return path.basename(filename, path.extname(filename)).replace(/_/g, ' ').trim() || filename;
  }

  private extractSortOrder(value: string): number {
    const match = value.match(/^(\d+)/);
    return match ? Number.parseInt(match[1], 10) : 999;
  }

  private getOrCreateModule(modulePath: string, moduleName: string): number | null {
    if (moduleName === 'Root') {
      return null;
    }

    const existing = this.database.get<{ id: number }>('SELECT id FROM modules WHERE path = ?', [modulePath]);
    if (existing) {
      return existing.id;
    }

    const result = this.database.run(
      'INSERT INTO modules (name, path, sort_order) VALUES (?, ?, ?)',
      [moduleName, modulePath, this.extractSortOrder(moduleName)],
    );
    return Number(result.lastInsertRowid);
  }

  private getVideoOrderBy(sortBy: CatalogSort): string {
    switch (sortBy) {
      case 'name_desc':
        return 'ORDER BY sort_order DESC, filename DESC';
      case 'date':
        return 'ORDER BY created_at ASC';
      case 'date_desc':
        return 'ORDER BY created_at DESC';
      case 'name':
      default:
        return 'ORDER BY sort_order, filename';
    }
  }
}
