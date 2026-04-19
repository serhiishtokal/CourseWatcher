import type { PlayerPayload } from '@contracts/api';
import { act, render } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { usePlaybackController } from './use-playback-controller';

const mockNavigate = vi.fn();
const mockCreateProgressBeacon = vi.fn();
const mockSaveVideoNotes = vi.fn();
const mockUpdateVideoProgress = vi.fn();
const mockUpdateVideoStatus = vi.fn();

const plyrConstructor = vi.fn();
const playerEventHandlers = new Map<string, () => void>();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../shared/http/api-client', () => ({
  createProgressBeacon: (...args: unknown[]) => mockCreateProgressBeacon(...args),
  saveVideoNotes: (...args: unknown[]) => mockSaveVideoNotes(...args),
  updateVideoProgress: (...args: unknown[]) => mockUpdateVideoProgress(...args),
  updateVideoStatus: (...args: unknown[]) => mockUpdateVideoStatus(...args),
}));

vi.mock('plyr', () => {
  class MockPlyr {
    currentTime = 42;
    duration = 300;
    destroy = vi.fn();

    constructor(element: HTMLVideoElement, options: unknown) {
      plyrConstructor(element, options);
    }

    on(eventName: string, handler: () => void) {
      playerEventHandlers.set(eventName, handler);
    }
  }

  return {
    default: MockPlyr,
  };
});

function PlaybackHarness({ payload }: { payload: PlayerPayload }) {
  const controller = usePlaybackController(payload);

  return (
    <div ref={controller.playerShellRef}>
      <div ref={controller.playerHostRef} />
    </div>
  );
}

describe('usePlaybackController', () => {
  const originalFullscreenDescriptor = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
  const originalLoad = HTMLMediaElement.prototype.load;
  const originalPlay = HTMLMediaElement.prototype.play;
  const originalPause = HTMLMediaElement.prototype.pause;

  let fullscreenElement: Element | null = null;
  let loadSpy: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    fullscreenElement = null;
    playerEventHandlers.clear();
    plyrConstructor.mockClear();
    mockNavigate.mockReset();
    mockCreateProgressBeacon.mockReset();
    mockSaveVideoNotes.mockReset();
    mockUpdateVideoProgress.mockReset();
    mockUpdateVideoStatus.mockReset();

    loadSpy = vi.fn<() => void>();
    HTMLMediaElement.prototype.load = loadSpy as typeof HTMLMediaElement.prototype.load;
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined) as typeof HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.pause = vi.fn() as typeof HTMLMediaElement.prototype.pause;

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });
  });

  afterEach(() => {
    HTMLMediaElement.prototype.load = originalLoad;
    HTMLMediaElement.prototype.play = originalPlay;
    HTMLMediaElement.prototype.pause = originalPause;

    if (originalFullscreenDescriptor) {
      Object.defineProperty(document, 'fullscreenElement', originalFullscreenDescriptor);
      return;
    }

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });
  });

  it('does not rebuild or reload the video when fullscreen state changes', () => {
    const payload: PlayerPayload = {
      adjacent: { prev: 1, next: 3 },
      notes: { content: '', videoId: 2 },
      queue: {
        currentId: 2,
        moduleName: 'Videos',
        videos: [
          {
            id: 1,
            title: 'One',
            filename: 'one.mp4',
            duration: 300,
            position: 0,
            status: 'completed',
            moduleId: 10,
            moduleName: 'Videos',
          },
          {
            id: 2,
            title: 'Two',
            filename: 'two.mp4',
            duration: 300,
            position: 42,
            status: 'in-progress',
            moduleId: 10,
            moduleName: 'Videos',
          },
          {
            id: 3,
            title: 'Three',
            filename: 'three.mp4',
            duration: 300,
            position: 0,
            status: 'unwatched',
            moduleId: 10,
            moduleName: 'Videos',
          },
        ],
      },
      startPosition: 42,
      video: {
        id: 2,
        title: 'Two',
        filename: 'two.mp4',
        duration: 300,
        position: 42,
        status: 'in-progress',
        moduleId: 10,
        moduleName: 'Videos',
        path: 'D:/videos/two.mp4',
      },
    };

    const { container } = render(<PlaybackHarness payload={payload} />);

    expect(plyrConstructor).toHaveBeenCalledTimes(1);
    expect(loadSpy).toHaveBeenCalledTimes(1);

    fullscreenElement = container.firstElementChild;

    act(() => {
      playerEventHandlers.get('enterfullscreen')?.();
    });

    expect(plyrConstructor).toHaveBeenCalledTimes(1);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });
});
