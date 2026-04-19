import type { MutationVideoResponse, VideoStatus } from '../../shared/contracts/api';
import { appConfig } from '../../platform/config/app-config';
import type { VideoRow } from '../../platform/database/database-manager';
import { NotFoundError, ValidationError } from '../../platform/errors/app-error';
import { CatalogRepository } from '../catalog/catalog-repository';
import { toVideoDetails } from '../catalog/catalog-mappers';
import { PlaybackRepository } from './playback-repository';

export class PlaybackService {
  constructor(
    private readonly playbackRepository: PlaybackRepository,
    private readonly catalogRepository: CatalogRepository,
  ) {}

  getPlaybackStartPosition(video: VideoRow): number {
    const isShortVideo =
      video.duration > 0 && video.duration < appConfig.shortVideoResumeCutoffSeconds;

    if (video.status === 'completed' || isShortVideo) {
      return 0;
    }

    return video.status === 'in-progress' ? video.position : 0;
  }

  updatePosition(videoId: number, position: number, duration?: number | null): MutationVideoResponse {
    if (typeof position !== 'number' || Number.isNaN(position) || position < 0) {
      throw new ValidationError('Position must be a non-negative number');
    }

    const video = this.playbackRepository.findVideo(videoId);
    if (!video) {
      throw new NotFoundError(`Video with id ${videoId}`);
    }

    const effectiveDuration = typeof duration === 'number' && !Number.isNaN(duration)
      ? duration
      : video.duration;
    const isShortVideo =
      effectiveDuration > 0 && effectiveDuration < appConfig.shortVideoResumeCutoffSeconds;
    const completionPosition = effectiveDuration * appConfig.completionThreshold;

    let nextStatus = video.status;
    if (effectiveDuration > 0) {
      const watchPercent = position / effectiveDuration;
      if (watchPercent >= appConfig.completionThreshold) {
        nextStatus = 'completed';
      } else if (position > 0) {
        nextStatus = 'in-progress';
      }
    } else if (position > 0 && video.status === 'unwatched') {
      nextStatus = 'in-progress';
    }

    const shouldPreserveCompletedProgress =
      video.status === 'completed' && effectiveDuration > 0 && position < completionPosition;

    if (shouldPreserveCompletedProgress) {
      nextStatus = 'completed';
    }

    let nextPosition = position;
    if (shouldPreserveCompletedProgress) {
      nextPosition = video.position;
    } else if (isShortVideo && nextStatus !== 'completed') {
      nextPosition = 0;
    }

    this.playbackRepository.updateVideo(
      videoId,
      nextPosition,
      typeof duration === 'number' ? duration : null,
      nextStatus,
    );

    return {
      success: true,
      video: this.getVideoDetails(videoId),
    };
  }

  updateStatus(videoId: number, status: VideoStatus): MutationVideoResponse {
    const allowedStatuses: VideoStatus[] = ['unwatched', 'in-progress', 'completed'];
    if (!allowedStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
    }

    const video = this.playbackRepository.findVideo(videoId);
    if (!video) {
      throw new NotFoundError(`Video with id ${videoId}`);
    }

    const nextPosition = status === 'unwatched' ? 0 : video.position;
    this.playbackRepository.updateVideoStatus(videoId, status, nextPosition);

    return {
      success: true,
      video: this.getVideoDetails(videoId),
    };
  }

  getVideoDetails(videoId: number) {
    const video = this.catalogRepository.findVideoById(videoId);
    if (!video) {
      throw new NotFoundError(`Video with id ${videoId}`);
    }

    const moduleName = this.catalogRepository.findModuleName(video.module_id);
    return toVideoDetails(video, moduleName);
  }
}
