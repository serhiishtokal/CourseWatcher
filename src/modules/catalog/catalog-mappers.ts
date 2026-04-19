import type {
  CatalogModule,
  CatalogSort,
  CourseStats,
  SearchResult,
  VideoDetails,
  VideoSummary,
} from '../../shared/contracts/api';
import type { ModuleRow, VideoRow } from '../../platform/database/database-manager';

export function normalizeSort(sortBy: string | undefined): CatalogSort {
  const allowedSorts: CatalogSort[] = ['name', 'name_desc', 'date', 'date_desc'];
  return allowedSorts.includes(sortBy as CatalogSort) ? (sortBy as CatalogSort) : 'name';
}

export function toVideoSummary(
  video: VideoRow,
  moduleName: string | null = null,
): VideoSummary {
  return {
    id: video.id,
    title: video.title,
    filename: video.filename,
    duration: video.duration,
    position: video.position,
    status: video.status,
    moduleId: video.module_id,
    moduleName,
  };
}

export function toVideoDetails(
  video: VideoRow,
  moduleName: string | null = null,
): VideoDetails {
  return {
    ...toVideoSummary(video, moduleName),
    path: video.path,
  };
}

export function toCatalogModule(
  moduleRow: ModuleRow | null,
  videos: VideoSummary[],
): CatalogModule {
  return {
    id: moduleRow?.id ?? null,
    name: moduleRow?.name ?? 'Videos',
    videos,
  };
}

export function toCourseStats(total: number, completed: number, inProgress: number): CourseStats {
  return {
    total,
    completed,
    inProgress,
    unwatched: total - completed - inProgress,
    percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function toSearchResult(video: VideoRow, moduleName: string | null): SearchResult {
  return toVideoSummary(video, moduleName);
}
