export type VideoStatus = 'unwatched' | 'in-progress' | 'completed';

export type CatalogSort = 'name' | 'name_desc' | 'date' | 'date_desc';

export interface CourseStats {
  total: number;
  completed: number;
  inProgress: number;
  unwatched: number;
  percentComplete: number;
}

export interface VideoSummary {
  id: number;
  title: string;
  filename: string;
  duration: number;
  position: number;
  status: VideoStatus;
  moduleId: number | null;
  moduleName: string | null;
}

export interface CatalogModule {
  id: number | null;
  name: string;
  videos: VideoSummary[];
}

export interface CatalogResponse {
  currentSort: CatalogSort;
  modules: CatalogModule[];
  stats: CourseStats;
}

export interface AdjacentVideos {
  prev: number | null;
  next: number | null;
}

export interface NoteDto {
  videoId: number;
  content: string;
}

export interface QueuePayload {
  currentId: number;
  moduleName: string;
  videos: VideoSummary[];
}

export interface VideoDetails extends VideoSummary {
  path: string;
}

export interface PlayerPayload {
  adjacent: AdjacentVideos;
  notes: NoteDto;
  queue: QueuePayload;
  startPosition: number;
  video: VideoDetails;
}

export interface SearchResult extends VideoSummary {}

export interface MutationVideoResponse {
  success: true;
  video: VideoDetails;
}

export interface MutationNotesResponse {
  success: true;
  notes: NoteDto;
}
