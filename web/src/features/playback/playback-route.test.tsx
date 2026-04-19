import type { ComponentPropsWithoutRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlaybackRoute } from './playback-route';

const mockUseLoaderData = vi.fn();
const mockUsePlaybackController = vi.fn();

vi.mock('react-router', () => ({
  Link: ({ children, ...props }: ComponentPropsWithoutRef<'a'>) => <a {...props}>{children}</a>,
  useLoaderData: () => mockUseLoaderData(),
}));

vi.mock('./use-playback-controller', () => ({
  usePlaybackController: () => mockUsePlaybackController(),
}));

describe('PlaybackRoute', () => {
  it('renders fullscreen navigation buttons inside the player shell when adjacent videos exist', () => {
    mockUseLoaderData.mockReturnValue({
      adjacent: { prev: 1, next: 3 },
      notes: { content: '', videoId: 2 },
      queue: {
        currentId: 2,
        moduleName: 'Videos',
        videos: [
          { id: 1, title: 'One', status: 'completed' },
          { id: 2, title: 'Two', status: 'in-progress' },
          { id: 3, title: 'Three', status: 'unwatched' },
        ],
      },
      startPosition: 0,
      video: { id: 2, title: 'Two', status: 'in-progress' },
    });

    mockUsePlaybackController.mockReturnValue({
      autoplayCountdown: null,
      canGoNext: true,
      canGoPrevious: true,
      cancelAutoplay: vi.fn(),
      goToNextVideo: vi.fn(),
      goToPreviousVideo: vi.fn(),
      handleNotesSave: vi.fn(),
      handleStatusChange: vi.fn(),
      isShellFullscreen: true,
      notes: '',
      notesMessage: '',
      playerHostRef: { current: null },
      playerShellRef: { current: null },
      setNotes: vi.fn(),
      status: 'in-progress',
    });

    render(<PlaybackRoute />);

    expect(screen.getByLabelText('Previous video')).toBeInTheDocument();
    expect(screen.getByLabelText('Next video')).toBeInTheDocument();
    expect(screen.getByText('Queue')).toBeInTheDocument();
  });
});
