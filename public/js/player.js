/**
 * Video Player Controls
 * 
 * Handles keyboard shortcuts, playback controls, and progress auto-save.
 */

(function () {
    'use strict';

    // Constants
    const SPEED_STEP = 0.25;
    const MIN_SPEED = 0.25;
    const MAX_SPEED = 4.0;
    const SEEK_SHORT = 5;
    const SEEK_MEDIUM = 10;
    const SEEK_LONG = 30;
    const SAVE_INTERVAL = 5000; // Save progress every 5 seconds

    // Elements
    const video = document.getElementById('videoPlayer');
    const speedDisplay = document.getElementById('speedDisplay');
    const speedDown = document.getElementById('speedDown');
    const speedUp = document.getElementById('speedUp');
    const seekBack5 = document.getElementById('seekBack5');
    const seekForward5 = document.getElementById('seekForward5');
    const seekForward10 = document.getElementById('seekForward10');
    const statusButtons = document.querySelectorAll('.status-btn');
    const notesEditor = document.getElementById('notesEditor');
    const saveNotesBtn = document.getElementById('saveNotes');
    const notesSaveStatus = document.getElementById('notesSaveStatus');

    if (!video) return;

    const videoId = video.dataset.videoId;
    const savedPosition = parseFloat(video.dataset.savedPosition) || 0;

    let saveTimeout = null;
    let lastSavedPosition = savedPosition;

    // ==========================================
    // Initialization
    // ==========================================

    /**
     * Initialize player
     */
    function init() {
        // Restore saved position
        video.addEventListener('loadedmetadata', () => {
            if (savedPosition > 0 && savedPosition < video.duration) {
                video.currentTime = savedPosition;
            }
            updateSpeedDisplay();
        });

        // Set up event listeners
        setupPlaybackControls();
        setupStatusControls();
        setupKeyboardShortcuts();
        setupNotesControls();
        setupProgressAutoSave();
    }

    // ==========================================
    // Playback Controls
    // ==========================================

    function setupPlaybackControls() {
        speedDown?.addEventListener('click', () => changeSpeed(-SPEED_STEP));
        speedUp?.addEventListener('click', () => changeSpeed(SPEED_STEP));
        seekBack5?.addEventListener('click', () => seek(-SEEK_SHORT));
        seekForward5?.addEventListener('click', () => seek(SEEK_SHORT));
        seekForward10?.addEventListener('click', () => seek(SEEK_MEDIUM));
    }

    function changeSpeed(delta) {
        let newSpeed = video.playbackRate + delta;
        newSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, newSpeed));
        newSpeed = Math.round(newSpeed * 100) / 100; // Fix floating point
        video.playbackRate = newSpeed;
        updateSpeedDisplay();
    }

    function updateSpeedDisplay() {
        if (speedDisplay) {
            speedDisplay.textContent = video.playbackRate.toFixed(2) + 'x';
        }
    }

    function seek(seconds) {
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
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
    // Keyboard Shortcuts
    // ==========================================

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in notes
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                return;
            }

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    video.paused ? video.play() : video.pause();
                    break;
                case 'w':
                    changeSpeed(-SPEED_STEP);
                    break;
                case 'e':
                    changeSpeed(SPEED_STEP);
                    break;
                case 'j':
                    seek(e.shiftKey ? -SEEK_LONG : -SEEK_SHORT);
                    break;
                case 'k':
                    seek(SEEK_SHORT);
                    break;
                case 'l':
                    seek(e.shiftKey ? SEEK_LONG : SEEK_MEDIUM);
                    break;
                case 'arrowleft':
                    seek(-SEEK_SHORT);
                    break;
                case 'arrowright':
                    seek(SEEK_SHORT);
                    break;
                case 'arrowup':
                    e.preventDefault();
                    video.volume = Math.min(1, video.volume + 0.1);
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    video.volume = Math.max(0, video.volume - 0.1);
                    break;
                case 'm':
                    video.muted = !video.muted;
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
            }
        });
    }

    function toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            video.requestFullscreen?.() || video.webkitRequestFullscreen?.();
        }
    }

    // ==========================================
    // Progress Auto-Save
    // ==========================================

    function setupProgressAutoSave() {
        // Save on pause
        video.addEventListener('pause', saveProgress);

        // Save on video end
        video.addEventListener('ended', () => {
            saveProgress();
            updateStatus('completed');
        });

        // Periodic save during playback
        video.addEventListener('timeupdate', () => {
            const currentPos = Math.floor(video.currentTime);

            // Only save every 5 seconds of playback
            if (Math.abs(currentPos - lastSavedPosition) >= 5) {
                scheduleProgressSave();
            }
        });

        // Save before page unload
        window.addEventListener('beforeunload', () => {
            saveProgressSync();
        });
    }

    function scheduleProgressSave() {
        if (saveTimeout) return;

        saveTimeout = setTimeout(() => {
            saveProgress();
            saveTimeout = null;
        }, 1000);
    }

    async function saveProgress() {
        const position = video.currentTime;
        const duration = video.duration;

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

    function saveProgressSync() {
        const position = video.currentTime;
        const duration = video.duration;

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
