import type { CatalogResponse, PlayerPayload, SearchResult } from '../../shared/contracts/api';
import { NotFoundError } from '../../platform/errors/app-error';
import {
  normalizeSort,
  toCatalogModule,
  toCourseStats,
  toSearchResult,
  toVideoDetails,
  toVideoSummary,
} from './catalog-mappers';
import { CatalogRepository } from './catalog-repository';
import { NotesService } from '../notes/notes-service';
import { PlaybackService } from '../playback/playback-service';

export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly playbackService: PlaybackService,
    private readonly notesService: NotesService,
  ) {}

  scanVideos(): { added: number; existing: number; total: number } {
    return this.catalogRepository.scanVideos();
  }

  getCatalog(sortBy: string | undefined): CatalogResponse {
    const currentSort = normalizeSort(sortBy);
    const modules = this.catalogRepository.listModules().map((moduleRow) =>
      toCatalogModule(
        moduleRow,
        this.catalogRepository
          .listVideosForModule(moduleRow.id, currentSort)
          .map((video) => toVideoSummary(video, moduleRow.name)),
      ),
    );
    const rootVideos = this.catalogRepository
      .listVideosForModule(null, currentSort)
      .map((video) => toVideoSummary(video, null));

    if (rootVideos.length > 0) {
      modules.unshift(toCatalogModule(null, rootVideos));
    }

    const counts = this.catalogRepository.getStatsCounts();

    return {
      currentSort,
      modules,
      stats: toCourseStats(counts.total, counts.completed, counts.inProgress),
    };
  }

  getStats() {
    const counts = this.catalogRepository.getStatsCounts();
    return toCourseStats(counts.total, counts.completed, counts.inProgress);
  }

  getPlayerPayload(videoId: number): PlayerPayload {
    const video = this.catalogRepository.findVideoById(videoId);
    if (!video) {
      throw new NotFoundError(`Video with id ${videoId}`);
    }

    const moduleName = this.catalogRepository.findModuleName(video.module_id);

    return {
      video: toVideoDetails(video, moduleName),
      adjacent: this.catalogRepository.listAdjacentVideoIds(video),
      notes: this.notesService.getNotes(videoId),
      queue: {
        currentId: video.id,
        moduleName: moduleName ?? 'Videos',
        videos: this.catalogRepository
          .listQueueVideos(video)
          .map((queueVideo) => toVideoSummary(queueVideo, moduleName)),
      },
      startPosition: this.playbackService.getPlaybackStartPosition(video),
    };
  }

  searchVideos(query: string): SearchResult[] {
    if (!query) {
      return [];
    }

    return this.catalogRepository
      .searchVideos(query)
      .map((video) => toSearchResult(video, video.module_name));
  }

  getVideoPath(videoId: number): string {
    const video = this.catalogRepository.findVideoById(videoId);
    if (!video) {
      throw new NotFoundError(`Video with id ${videoId}`);
    }

    return video.path;
  }
}
