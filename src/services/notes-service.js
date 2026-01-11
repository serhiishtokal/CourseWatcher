/**
 * Notes Service
 * 
 * Handles per-video notes with Markdown support.
 * 
 * @module services/notes-service
 */

const { NotFoundError } = require('../utils/errors');

/**
 * Notes service class
 */
class NotesService {
    /**
     * Create a new NotesService
     * @param {DatabaseManager} database - Database manager instance
     */
    constructor(database) {
        this._db = database;
    }

    /**
     * Get notes for a video
     * @param {number} videoId - Video ID
     * @returns {Object} Notes object
     */
    getNotes(videoId) {
        // Verify video exists
        const video = this._db.get('SELECT id FROM videos WHERE id = ?', [videoId]);
        if (!video) {
            throw new NotFoundError(`Video with id ${videoId}`);
        }

        const notes = this._db.get(
            'SELECT * FROM notes WHERE video_id = ?',
            [videoId]
        );

        return notes || { video_id: videoId, content: '' };
    }

    /**
     * Save notes for a video
     * @param {number} videoId - Video ID
     * @param {string} content - Note content (Markdown)
     * @returns {Object} Updated notes
     */
    saveNotes(videoId, content) {
        // Verify video exists
        const video = this._db.get('SELECT id FROM videos WHERE id = ?', [videoId]);
        if (!video) {
            throw new NotFoundError(`Video with id ${videoId}`);
        }

        // Upsert notes
        this._db.run(
            `INSERT INTO notes (video_id, content, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(video_id) DO UPDATE SET
         content = excluded.content,
         updated_at = CURRENT_TIMESTAMP`,
            [videoId, content]
        );

        return this.getNotes(videoId);
    }

    /**
     * Delete notes for a video
     * @param {number} videoId - Video ID
     * @returns {boolean} True if deleted
     */
    deleteNotes(videoId) {
        const result = this._db.run(
            'DELETE FROM notes WHERE video_id = ?',
            [videoId]
        );
        return result.changes > 0;
    }

    /**
     * Get all videos with notes
     * @returns {Array} Videos with notes
     */
    getVideosWithNotes() {
        return this._db.all(
            `SELECT v.*, n.content as notes_content
       FROM videos v
       INNER JOIN notes n ON v.id = n.video_id
       WHERE n.content != ''
       ORDER BY v.sort_order, v.filename`
        );
    }
}

module.exports = { NotesService };
