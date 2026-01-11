/**
 * Video Player Controls
 * 
 * Handles Plyr initialization, keyboard shortcuts, and progress auto-save.
 */

(function () {
    'use strict';

    // Constants
    const SAVE_INTERVAL = 5000; // Save progress every 5 seconds

    // Elements
    const videoElement = document.getElementById('videoPlayer');

    // Notes & Status
    const notesEditor = document.getElementById('notesEditor');
    const saveNotesBtn = document.getElementById('saveNotes');
    const notesSaveStatus = document.getElementById('notesSaveStatus');
    const statusButtons = document.querySelectorAll('.status-btn');

    if (!videoElement) return;

    const videoId = videoElement.dataset.videoId;
    const savedPosition = parseFloat(videoElement.dataset.savedPosition) || 0;

    let saveTimeout = null;
    let lastSavedPosition = savedPosition;

    // ==========================================
    // Initialization
    // ==========================================

    function init() {
        // Initialize Plyr
        const player = new Plyr('#videoPlayer', {
            keyboard: { focused: true, global: true },
            seekTime: 5,
            controls: [
                'play-large', // The large play button in the center
                'restart', // Restart playback
                'rewind', // Rewind by the seek time (default 10 seconds)
                'play', // Play/pause playback
                'fast-forward', // Fast forward by the seek time (default 10 seconds)
                'progress', // The progress bar and scrubber for playback and buffering
                'current-time', // The current time of playback
                'duration', // The full duration of the media
                'mute', // Toggle mute
                'volume', // Volume control
                'captions', // Toggle captions
                'settings', // Settings menu
                'pip', // Picture-in-picture (currently Safari only)
                'airplay', // Airplay (currently Safari only)
                'fullscreen', // Toggle fullscreen
            ]
        });

        // Restore saved position
        player.on('ready', () => {
            if (savedPosition > 0) {
                player.currentTime = savedPosition;
            }
        });

        // Setup Logic
        setupStatusControls();
        setupNotesControls();
        setupProgressAutoSave(player);

        // Custom shortcuts not covered by Plyr (if any)
        // Plyr covers Space, K, F, M, Arrow keys.
        // We can add custom ones if needed, but standard ones are usually enough.
    }

    // ==========================================
    // Status Controls
    // ==========================================

    function setupStatusControls() {
        statusButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const status = btn.dataset.status;
                updateStatus(status);
            });
        });
    }

    async function updateStatus(status) {
        try {
            const response = await fetch(`/api/videos/${videoId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                // Update UI
                statusButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.status === status);
                });
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    }

    // ==========================================
    // Progress Auto-Save
    // ==========================================

    function setupProgressAutoSave(player) {
        // Save on pause
        player.on('pause', () => saveProgress(player));

        // Save on video end
        player.on('ended', () => {
            saveProgress(player);
            updateStatus('completed');
        });

        // Periodic save during playback
        player.on('timeupdate', () => {
            const currentPos = Math.floor(player.currentTime);

            // Only save every 5 seconds of playback
            if (Math.abs(currentPos - lastSavedPosition) >= 5) {
                scheduleProgressSave(player);
            }
        });

        // Save before page unload
        window.addEventListener('beforeunload', () => {
            saveProgressSync(player);
        });
    }

    function scheduleProgressSave(player) {
        if (saveTimeout) return;

        saveTimeout = setTimeout(() => {
            saveProgress(player);
            saveTimeout = null;
        }, 1000);
    }

    async function saveProgress(player) {
        const position = player.currentTime;
        const duration = player.duration;

        if (isNaN(position) || isNaN(duration)) return;

        try {
            await fetch(`/api/videos/${videoId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position, duration }),
            });
            lastSavedPosition = position;
        } catch (err) {
            console.error('Failed to save progress:', err);
        }
    }

    function saveProgressSync(player) {
        const position = player.currentTime;
        const duration = player.duration;

        if (isNaN(position) || isNaN(duration)) return;

        // Use sendBeacon for reliable delivery on page unload
        navigator.sendBeacon(
            `/api/videos/${videoId}/progress`,
            new Blob([JSON.stringify({ position, duration })], { type: 'application/json' })
        );
    }

    // ==========================================
    // Notes Controls
    // ==========================================

    function setupNotesControls() {
        if (!saveNotesBtn || !notesEditor) return;

        saveNotesBtn.addEventListener('click', saveNotes);

        // Auto-save notes on blur
        notesEditor.addEventListener('blur', saveNotes);

        // Ctrl+S to save notes
        notesEditor.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveNotes();
            }
        });
    }

    async function saveNotes() {
        const content = notesEditor.value;

        try {
            const response = await fetch(`/api/videos/${videoId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (response.ok) {
                showSaveStatus('✓ Saved');
            } else {
                showSaveStatus('✗ Error saving');
            }
        } catch (err) {
            console.error('Failed to save notes:', err);
            showSaveStatus('✗ Error saving');
        }
    }

    function showSaveStatus(message) {
        if (!notesSaveStatus) return;

        notesSaveStatus.textContent = message;
        setTimeout(() => {
            notesSaveStatus.textContent = '';
        }, 2000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
