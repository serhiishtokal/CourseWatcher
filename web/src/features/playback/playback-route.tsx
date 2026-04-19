import type { PlayerPayload, VideoStatus } from '@contracts/api';
import { KeyboardEvent } from 'react';
import { Link, useLoaderData } from 'react-router';
import { fetchPlayerPayload } from '../../shared/http/api-client';
import { usePlaybackController } from './use-playback-controller';

export async function playbackLoader({
  params,
}: {
  params: { videoId?: string };
}) {
  if (!params.videoId) {
    throw new Error('Video id is required');
  }

  return fetchPlayerPayload(params.videoId);
}

export function PlaybackRoute() {
  const payload = useLoaderData() as PlayerPayload;
  const controller = usePlaybackController(payload);
  const nextVideo = payload.queue.videos.find((video) => video.id === payload.adjacent.next) ?? null;

  function handleNotesKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      void controller.handleNotesSave();
    }
  }

  function getQueueStatusSymbol(status: VideoStatus) {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '▶';
      case 'unwatched':
      default:
        return '○';
    }
  }

  return (
    <div className="player-layout">
      <section className="player-main">
        <div className="section-header">
          <div>
            <h1>{payload.video.title}</h1>
            <p>{payload.queue.moduleName}</p>
          </div>
          <span className={`status-badge status-${controller.status}`}>{controller.status}</span>
        </div>

        <div className="player-shell" ref={controller.playerShellRef}>
          <div className={controller.isShellFullscreen ? 'fullscreen-nav visible' : 'fullscreen-nav'} aria-hidden={!controller.isShellFullscreen}>
            {controller.canGoPrevious ? (
              <div className="fullscreen-nav-zone previous">
                <button
                  aria-label="Previous video"
                  className="fullscreen-nav-button previous"
                  onClick={() => controller.goToPreviousVideo()}
                  type="button"
                >
                  <span className="fullscreen-nav-icon">←</span>
                  <span className="fullscreen-nav-label">Prev</span>
                </button>
              </div>
            ) : null}

            {controller.canGoNext ? (
              <div className="fullscreen-nav-zone next">
                <button
                  aria-label="Next video"
                  className="fullscreen-nav-button next"
                  onClick={() => controller.goToNextVideo()}
                  type="button"
                >
                  <span className="fullscreen-nav-label">Next</span>
                  <span className="fullscreen-nav-icon">→</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="player-frame">
            <div className="player-host" ref={controller.playerHostRef} />

            {controller.autoplayCountdown !== null && nextVideo ? (
              <div className="overlay-card">
                <strong>Up next in {controller.autoplayCountdown}s</strong>
                <span>{nextVideo.title}</span>
                <div className="notes-actions">
                  <button onClick={() => controller.cancelAutoplay()} type="button">
                    Cancel
                  </button>
                  <Link to={`/video/${nextVideo.id}`}>Play now</Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="player-nav">
          {payload.adjacent.prev ? <Link to={`/video/${payload.adjacent.prev}`}>Previous</Link> : <span>Previous</span>}
          <Link to="/">Back to Course</Link>
          {payload.adjacent.next ? <Link to={`/video/${payload.adjacent.next}`}>Next</Link> : <span>Next</span>}
        </div>

        <section className="status-panel stack">
          <div>
            <h2>Status</h2>
            <p>Completed videos restart at the beginning. Short videos never keep partial resume.</p>
          </div>
          <div className="status-buttons">
            {(['unwatched', 'in-progress', 'completed'] as VideoStatus[]).map((option) => (
              <button
                key={option}
                className={controller.status === option ? 'status-button active' : 'status-button'}
                onClick={() => void controller.handleStatusChange(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <section className="notes-panel stack">
          <div className="section-header">
            <div>
              <h2>Notes</h2>
              <p>Markdown-friendly notes that autosave on blur and with Ctrl/Cmd+S.</p>
            </div>
            <span className="muted">{controller.notesMessage}</span>
          </div>
          <textarea
            className="notes-editor"
            onBlur={() => void controller.handleNotesSave()}
            onChange={(event) => controller.setNotes(event.target.value)}
            onKeyDown={handleNotesKeyDown}
            placeholder="Write notes for this lesson..."
            value={controller.notes}
          />
          <div className="notes-actions">
            <button onClick={() => void controller.handleNotesSave()} type="button">
              Save Notes
            </button>
          </div>
        </section>
      </section>

      <aside className="queue-panel">
        <div className="section-header">
          <div>
            <h2>Queue</h2>
            <p>{payload.queue.moduleName}</p>
          </div>
        </div>
        <div className="queue-list">
          {payload.queue.videos.map((video, index) => (
            <Link
              className={video.id === payload.queue.currentId ? 'queue-item active' : 'queue-item'}
              key={video.id}
              to={`/video/${video.id}`}
            >
              <div className="queue-item-main">
                <span className="queue-index">{index + 1}</span>
                <div className="queue-copy">
                  <strong>{video.title}</strong>
                </div>
              </div>
              <span
                aria-label={video.status}
                className={`queue-status-icon status-${video.status}`}
                title={video.status}
              >
                {getQueueStatusSymbol(video.status)}
              </span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
