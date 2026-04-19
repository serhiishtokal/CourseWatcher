import type {
  CatalogResponse,
  MutationNotesResponse,
  MutationVideoResponse,
  NoteDto,
  PlayerPayload,
  SearchResult,
  VideoStatus,
} from '@contracts/api';

export class HttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'HttpError';
  }
}

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new HttpError(payload?.message ?? 'Request failed', response.status);
  }

  return response.json() as Promise<T>;
}

export function fetchCatalog(sort?: string): Promise<CatalogResponse> {
  const query = sort ? `?sort=${encodeURIComponent(sort)}` : '';
  return readJson<CatalogResponse>(`/api/catalog${query}`);
}

export function fetchPlayerPayload(videoId: string): Promise<PlayerPayload> {
  return readJson<PlayerPayload>(`/api/videos/${videoId}`);
}

export function fetchSearchResults(query: string): Promise<SearchResult[]> {
  const search = query ? `?q=${encodeURIComponent(query)}` : '';
  return readJson<SearchResult[]>(`/api/search${search}`);
}

export function updateVideoProgress(
  videoId: number,
  position: number,
  duration: number,
): Promise<MutationVideoResponse> {
  return readJson<MutationVideoResponse>(`/api/videos/${videoId}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ position, duration }),
  });
}

export function updateVideoStatus(videoId: number, status: VideoStatus): Promise<MutationVideoResponse> {
  return readJson<MutationVideoResponse>(`/api/videos/${videoId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function saveVideoNotes(videoId: number, content: string): Promise<MutationNotesResponse> {
  return readJson<MutationNotesResponse>(`/api/videos/${videoId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export function createProgressBeacon(videoId: number, position: number, duration: number): boolean {
  return navigator.sendBeacon(
    `/api/videos/${videoId}/progress`,
    new Blob([JSON.stringify({ position, duration })], { type: 'application/json' }),
  );
}
