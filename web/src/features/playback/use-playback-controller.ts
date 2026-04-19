import type { PlayerPayload, VideoStatus } from '@contracts/api';
import Plyr from 'plyr';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { isEditableTarget } from './playback-keyboard';
import {
  createProgressBeacon,
  saveVideoNotes,
  updateVideoProgress,
  updateVideoStatus,
} from '../../shared/http/api-client';

const SAVE_INTERVAL_SECONDS = 5;
const AUTOPLAY_COUNTDOWN_SECONDS = 5;

export function usePlaybackController(payload: PlayerPayload) {
  const navigate = useNavigate();
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const mediaElementRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Plyr | null>(null);
  const lastSavedPositionRef = useRef(payload.startPosition);
  const saveTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const [isShellFullscreen, setIsShellFullscreen] = useState(false);
  const [notes, setNotes] = useState(payload.notes.content);
  const [status, setStatus] = useState(payload.video.status);
  const [notesMessage, setNotesMessage] = useState('');
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);

  useEffect(() => {
    setNotes(payload.notes.content);
    setStatus(payload.video.status);
    setNotesMessage('');
    setAutoplayCountdown(null);
    lastSavedPositionRef.current = payload.startPosition;
  }, [payload]);

  const persistStatus = useEffectEvent(async (nextStatus: VideoStatus) => {
    await updateVideoStatus(payload.video.id, nextStatus);
    setStatus(nextStatus);
  });

  const persistProgress = useEffectEvent(async () => {
    const player = playerRef.current;
    if (!player || Number.isNaN(player.currentTime) || Number.isNaN(player.duration)) {
      return;
    }

    await updateVideoProgress(payload.video.id, player.currentTime, player.duration);
    lastSavedPositionRef.current = player.currentTime;
  });

  const persistNotes = useEffectEvent(async () => {
    try {
      await saveVideoNotes(payload.video.id, notes);
      setNotesMessage('Saved');
    } catch {
      setNotesMessage('Could not save notes');
    }

    window.setTimeout(() => setNotesMessage(''), 1800);
  });

  const cancelAutoplay = useEffectEvent(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setAutoplayCountdown(null);
  });

  const goToPreviousVideo = useEffectEvent(() => {
    if (!payload.adjacent.prev) {
      return;
    }

    cancelAutoplay();
    navigate(`/video/${payload.adjacent.prev}`);
  });

  const goToNextVideo = useEffectEvent(() => {
    if (!payload.adjacent.next) {
      return;
    }

    cancelAutoplay();
    navigate(`/video/${payload.adjacent.next}`);
  });

  const startAutoplay = useEffectEvent(() => {
    if (!payload.adjacent.next) {
      return;
    }

    cancelAutoplay();
    setAutoplayCountdown(AUTOPLAY_COUNTDOWN_SECONDS);

    countdownIntervalRef.current = window.setInterval(() => {
      setAutoplayCountdown((current) => {
        if (current === null) {
          return null;
        }

        if (current <= 1) {
          window.clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          navigate(`/video/${payload.adjacent.next}`);
          return null;
        }

        return current - 1;
      });
    }, 1000);
  });

  useEffect(() => {
    const shell = playerShellRef.current;
    const host = playerHostRef.current;
    if (!shell || !host) {
      return undefined;
    }

    const element = document.createElement('video');
    element.controls = true;
    element.playsInline = true;
    element.preload = 'metadata';
    host.replaceChildren(element);
    mediaElementRef.current = element;

    const player = new Plyr(element, {
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: false,
        container: '.player-shell',
      },
      keyboard: { focused: true, global: true },
      controls: [
        'play-large',
        'restart',
        'rewind',
        'play',
        'fast-forward',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      seekTime: 5,
    });
    playerRef.current = player;

    const syncFullscreenState = () => {
      setIsShellFullscreen(
        document.fullscreenElement === shell || shell.classList.contains('plyr--fullscreen-fallback'),
      );
    };

    player.on('enterfullscreen', syncFullscreenState);
    player.on('exitfullscreen', syncFullscreenState);
    document.addEventListener('fullscreenchange', syncFullscreenState);

    player.on('pause', () => {
      void persistProgress();
    });

    player.on('timeupdate', () => {
      const currentPosition = Math.floor(player.currentTime || 0);
      if (Math.abs(currentPosition - lastSavedPositionRef.current) < SAVE_INTERVAL_SECONDS) {
        return;
      }

      if (saveTimeoutRef.current !== null) {
        return;
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        void persistProgress();
        saveTimeoutRef.current = null;
      }, 1000);
    });

    player.on('ended', () => {
      void persistProgress();
      void persistStatus('completed');
      startAutoplay();
    });

    const handleBeforeUnload = () => {
      if (!player.currentTime || !player.duration) {
        return;
      }

      createProgressBeacon(payload.video.id, player.currentTime, player.duration);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      player.destroy();
      playerRef.current = null;
      mediaElementRef.current = null;
      host.replaceChildren();
    };
  }, [navigate, persistProgress, persistStatus, startAutoplay]);

  useEffect(() => {
    const mediaElement = mediaElementRef.current;
    if (!mediaElement) {
      return;
    }

    cancelAutoplay();

    const handleLoadedMetadata = () => {
      if (payload.startPosition > 0) {
        mediaElement.currentTime = payload.startPosition;
      }

      void Promise.resolve(mediaElement.play()).catch(() => undefined);
    };

    mediaElement.pause();
    mediaElement.src = `/api/videos/${payload.video.id}/stream`;
    mediaElement.load();
    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });

    return () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [cancelAutoplay, payload]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey || isEditableTarget(event.target)) {
        return;
      }

      const normalizedKey = event.key.toLowerCase();

      if (normalizedKey === 'p') {
        event.preventDefault();
        goToPreviousVideo();
      }

      if (normalizedKey === 'n') {
        event.preventDefault();
        goToNextVideo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNextVideo, goToPreviousVideo]);

  async function handleStatusChange(nextStatus: VideoStatus) {
    await persistStatus(nextStatus);
  }

  async function handleNotesSave() {
    await persistNotes();
  }

  return {
    autoplayCountdown,
    canGoNext: payload.adjacent.next !== null,
    canGoPrevious: payload.adjacent.prev !== null,
    cancelAutoplay,
    goToNextVideo,
    goToPreviousVideo,
    handleNotesSave,
    handleStatusChange,
    isShellFullscreen,
    notes,
    notesMessage,
    playerHostRef,
    playerShellRef,
    setNotes,
    status,
  };
}
