/**
 * Progress Service
 * 
 * Handles video playback progress tracking and status updates.
 * 
 * @module services/progress-service
 */

const { config } = require('../utils/config');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * Progress service class
 */
class ProgressService {
    /**
     * Create a new ProgressService
     * @param {DatabaseManager} database - Database manager instance
     */
    constructor(database) {
        this._db = database;
    }

    /**
     * Update the playback position for a video
     * @param {number} videoId - Video ID
     * @param {number} position - Current position in seconds
     * @param {number} [duration] - Video duration in seconds
     * @returns {Object} Updated video
     */
    updatePosition(videoId, position, duration = null) {
        // Validate inputs
        if (typeof position !== 'number' || position < 0) {
            throw new ValidationError('Position must be a non-negative number');
        }

        // Get current video
        const video = this._db.get('SELECT * FROM videos WHERE id = ?', [videoId]);
        if (!video) {
            throw new NotFoundError(`Video with id ${videoId}`);
        }

        // Determine new status based on position
        let newStatus = video.status;
        const videoDuration = duration || video.duration;

        if (videoDuration > 0) {
            const watchPercent = position / videoDuration;

            if (watchPercent >= config.completionThreshold) {
                newStatus = 'completed';
            } else if (position > 0) {
                newStatus = 'in-progress';
            }
        } else if (position > 0 && video.status === 'unwatched') {
            newStatus = 'in-progress';
        }

        // Update database
        this._db.run(
            `UPDATE videos 
       SET position = ?, 
           duration = COALESCE(?, duration),
           status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [position, duration, newStatus, videoId]
        );

        return this._db.get('SELECT * FROM videos WHERE id = ?', [videoId]);
    }

    /**
     * Update video status manually
     * @param {number} videoId - Video ID
     * @param {string} status - New status
     * @returns {Object} Updated video
     */
    updateStatus(videoId, status) {
        const validStatuses = ['unwatched', 'in-progress', 'completed'];

        if (!validStatuses.includes(status)) {
            throw new ValidationError(
                `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            );
        }

        const video = this._db.get('SELECT * FROM videos WHERE id = ?', [videoId]);
        if (!video) {
            throw new NotFoundError(`Video with id ${videoId}`);
        }

        // Reset position if marking as unwatched
        const newPosition = status === 'unwatched' ? 0 : video.position;

        this._db.run(
            `UPDATE videos 
       SET status = ?, 
           position = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [status, newPosition, videoId]
        );

        return this._db.get('SELECT * FROM videos WHERE id = ?', [videoId]);
    }

    /**
     * Mark video as completed
     * @param {number} videoId - Video ID
     * @returns {Object} Updated video
     */
    markCompleted(videoId) {
        return this.updateStatus(videoId, 'completed');
    }

    /**
     * Mark video as unwatched (reset progress)
     * @param {number} videoId - Video ID
     * @returns {Object} Updated video
     */
    markUnwatched(videoId) {
        return this.updateStatus(videoId, 'unwatched');
    }

    /**
     * Get video progress info
     * @param {number} videoId - Video ID
     * @returns {Object} Progress info
     */
    getProgress(videoId) {
        const video = this._db.get('SELECT * FROM videos WHERE id = ?', [videoId]);
        if (!video) {
            throw new NotFoundError(`Video with id ${videoId}`);
        }

        return {
            position: video.position,
            duration: video.duration,
            status: video.status,
            percentWatched: video.duration > 0
                ? Math.round((video.position / video.duration) * 100)
                : 0,
        };
    }
}

module.exports = { ProgressService };
