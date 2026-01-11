/**
 * Video Service
 * 
 * Handles video discovery, scanning, and CRUD operations.
 * Groups videos into modules based on folder structure.
 * 
 * @module services/video-service
 */

const fs = require('fs');
const path = require('path');
const { config } = require('../utils/config');
const { NotFoundError } = require('../utils/errors');

/**
 * Video service class
 */
class VideoService {
    /**
     * Create a new VideoService
     * @param {DatabaseManager} database - Database manager instance
     */
    constructor(database) {
        this._db = database;
    }

    /**
     * Scan the course directory for video files
     * @returns {Object} Scan results with counts
     */
    scanVideos() {
        const coursePath = this._db.getCoursePath();
        const videos = this._findVideoFiles(coursePath);

        let addedCount = 0;
        let updatedCount = 0;

        this._db.transaction(() => {
            for (const video of videos) {
                const existing = this._db.get(
                    'SELECT id FROM videos WHERE path = ?',
                    [video.path]
                );

                if (existing) {
                    // Update title in case the extraction logic changed
                    this._db.run(
                        'UPDATE videos SET title = ? WHERE id = ?',
                        [video.title, existing.id]
                    );
                    updatedCount++;
                } else {
                    // Get or create module
                    const moduleId = this._getOrCreateModule(video.modulePath, video.moduleName);

                    // Insert video
                    this._db.run(
                        `INSERT INTO videos (path, filename, title, module_id, sort_order)
             VALUES (?, ?, ?, ?, ?)`,
                        [video.path, video.filename, video.title, moduleId, video.sortOrder]
                    );
                    addedCount++;
                }
            }
        });

        return {
            total: videos.length,
            added: addedCount,
            existing: updatedCount,
        };
    }

    /**
     * Find all video files in a directory recursively
     * @param {string} dir - Directory to scan
     * @param {string} [relativeTo] - Base path for relative paths
     * @returns {Array} Array of video info objects
     * @private
     */
    _findVideoFiles(dir, relativeTo = dir) {
        const videos = [];

        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                // Skip .coursewatcher folder
                if (entry.name === '.coursewatcher') continue;

                if (entry.isDirectory()) {
                    videos.push(...this._findVideoFiles(fullPath, relativeTo));
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (config.videoExtensions.includes(ext)) {
                        const relativePath = path.relative(relativeTo, fullPath);
                        const parts = relativePath.split(path.sep);

                        // Determine module (parent folder or 'Root')
                        let moduleName = 'Root';
                        let modulePath = relativeTo;

                        if (parts.length > 1) {
                            moduleName = parts[0];
                            modulePath = path.join(relativeTo, parts[0]);
                        }

                        videos.push({
                            path: fullPath,
                            filename: entry.name,
                            title: this._extractTitle(entry.name),
                            moduleName,
                            modulePath,
                            sortOrder: this._extractSortOrder(entry.name),
                        });
                    }
                }
            }
        } catch (err) {
            // Ignore permission errors
        }

        return videos.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    /**
     * Extract a clean title from filename
     * @param {string} filename - Video filename
     * @returns {string} Clean title
     * @private
     */
    _extractTitle(filename) {
        // Remove extension
        let title = path.basename(filename, path.extname(filename));

        // Replace underscores with spaces (but keep hyphens and dots as they may be meaningful)
        title = title.replace(/_/g, ' ');

        return title.trim() || filename;
    }

    /**
     * Extract sort order from filename (leading numbers)
     * @param {string} filename - Video filename
     * @returns {number} Sort order
     * @private
     */
    _extractSortOrder(filename) {
        const match = filename.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 999;
    }

    /**
     * Get or create a module
     * @param {string} modulePath - Full path to module folder
     * @param {string} moduleName - Module name
     * @returns {number|null} Module ID or null for root
     * @private
     */
    _getOrCreateModule(modulePath, moduleName) {
        if (moduleName === 'Root') return null;

        const existing = this._db.get(
            'SELECT id FROM modules WHERE path = ?',
            [modulePath]
        );

        if (existing) return existing.id;

        const sortOrder = this._extractSortOrder(moduleName);
        const result = this._db.run(
            'INSERT INTO modules (name, path, sort_order) VALUES (?, ?, ?)',
            [moduleName, modulePath, sortOrder]
        );

        return result.lastInsertRowid;
    }

    /**
     * Get all modules with their videos
     * @param {string} sortBy - Sort order: 'name', 'name_desc', 'date', 'date_desc' (default: 'name')
     * @returns {Array} Array of modules with videos
     */
    getAllModulesWithVideos(sortBy = 'name') {
        const modules = this._db.all(
            'SELECT * FROM modules ORDER BY sort_order, name'
        );

        // Determine ORDER BY clause based on sortBy
        let orderClause;
        switch (sortBy) {
            case 'name_desc':
                orderClause = 'ORDER BY sort_order DESC, filename DESC';
                break;
            case 'date':
                orderClause = 'ORDER BY created_at ASC';
                break;
            case 'date_desc':
                orderClause = 'ORDER BY created_at DESC';
                break;
            case 'name':
            default:
                orderClause = 'ORDER BY sort_order, filename';
                break;
        }

        // Get videos without a module (root level)
        const rootVideos = this._db.all(
            `SELECT * FROM videos WHERE module_id IS NULL ${orderClause}`
        );

        const result = [];

        // Add root videos as a pseudo-module if any exist
        if (rootVideos.length > 0) {
            result.push({
                id: null,
                name: 'Videos',
                videos: rootVideos,
            });
        }

        // Add each module with its videos
        for (const mod of modules) {
            const videos = this._db.all(
                `SELECT * FROM videos WHERE module_id = ? ${orderClause}`,
                [mod.id]
            );
            result.push({
                ...mod,
                videos,
            });
        }

        return result;
    }

    /**
     * Get a video by ID
     * @param {number} id - Video ID
     * @returns {Object} Video object
     * @throws {NotFoundError} If video not found
     */
    getVideoById(id) {
        const video = this._db.get('SELECT * FROM videos WHERE id = ?', [id]);

        if (!video) {
            throw new NotFoundError(`Video with id ${id}`);
        }

        return video;
    }

    /**
     * Get adjacent videos (previous and next)
     * @param {number} id - Current video ID
     * @returns {Object} Object with prev and next video IDs
     */
    getAdjacentVideos(id) {
        const video = this.getVideoById(id);

        // Get all videos in same module, ordered
        const videos = this._db.all(
            `SELECT id FROM videos 
       WHERE module_id ${video.module_id ? '= ?' : 'IS NULL'}
       ORDER BY sort_order, filename`,
            video.module_id ? [video.module_id] : []
        );

        const currentIndex = videos.findIndex(v => v.id === id);

        return {
            prev: currentIndex > 0 ? videos[currentIndex - 1].id : null,
            next: currentIndex < videos.length - 1 ? videos[currentIndex + 1].id : null,
        };
    }

    /**
     * Search videos by title
     * @param {string} query - Search query
     * @returns {Array} Matching videos
     */
    searchVideos(query) {
        const searchTerm = `%${query}%`;
        return this._db.all(
            `SELECT v.*, m.name as module_name 
       FROM videos v 
       LEFT JOIN modules m ON v.module_id = m.id
       WHERE v.title LIKE ? OR v.filename LIKE ?
       ORDER BY v.sort_order, v.filename`,
            [searchTerm, searchTerm]
        );
    }

    /**
     * Get course statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const total = this._db.get('SELECT COUNT(*) as count FROM videos');
        const completed = this._db.get(
            "SELECT COUNT(*) as count FROM videos WHERE status = 'completed'"
        );
        const inProgress = this._db.get(
            "SELECT COUNT(*) as count FROM videos WHERE status = 'in-progress'"
        );

        return {
            total: total.count,
            completed: completed.count,
            inProgress: inProgress.count,
            unwatched: total.count - completed.count - inProgress.count,
            percentComplete: total.count > 0
                ? Math.round((completed.count / total.count) * 100)
                : 0,
        };
    }
}

module.exports = { VideoService };
