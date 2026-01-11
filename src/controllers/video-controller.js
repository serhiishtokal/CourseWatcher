/**
 * Video Controller
 * 
 * Route handlers for video-related pages and API endpoints.
 * 
 * @module controllers/video-controller
 */

const path = require('path');
const express = require('express');
const { NotFoundError } = require('../utils/errors');

/**
 * Create video routes
 * @param {Object} services - Service instances
 * @returns {express.Router} Express router
 */
function createVideoRoutes(services) {
    const router = express.Router();
    const { videoService, progressService, notesService } = services;

    // ============================================
    // Page Routes
    // ============================================

    /**
     * Home page - List all modules and videos
     */
    router.get('/', (req, res) => {
        const sortBy = req.query.sort || 'name';
        const modules = videoService.getAllModulesWithVideos(sortBy);
        const stats = videoService.getStats();

        res.render('pages/index', {
            title: 'CourseWatcher',
            modules,
            stats,
            currentSort: sortBy,
        });
    });

    /**
     * Video player page
     */
    router.get('/video/:id', (req, res, next) => {
        try {
            const videoId = parseInt(req.params.id, 10);
            const video = videoService.getVideoById(videoId);
            const adjacent = videoService.getAdjacentVideos(videoId);
            const notes = notesService.getNotes(videoId);
            const queue = videoService.getQueueVideos(videoId);

            res.render('pages/player', {
                title: video.title,
                video,
                adjacent,
                notes,
                queue,
            });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Search page
     */
    router.get('/search', (req, res) => {
        const query = req.query.q || '';
        const results = query ? videoService.searchVideos(query) : [];

        res.render('pages/search', {
            title: 'Search',
            query,
            results,
        });
    });

    // ============================================
    // API Routes
    // ============================================

    /**
     * Stream video file
     */
    router.get('/api/videos/:id/stream', (req, res, next) => {
        try {
            const videoId = parseInt(req.params.id, 10);
            const video = videoService.getVideoById(videoId);

            res.sendFile(video.path);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Update video progress (position)
     */
    router.post('/api/videos/:id/progress', express.json(), (req, res, next) => {
        try {
            const videoId = parseInt(req.params.id, 10);
            const { position, duration } = req.body;

            const updated = progressService.updatePosition(videoId, position, duration);
            res.json({ success: true, video: updated });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Update video status
     */
    router.post('/api/videos/:id/status', express.json(), (req, res, next) => {
        try {
            const videoId = parseInt(req.params.id, 10);
            const { status } = req.body;

            const updated = progressService.updateStatus(videoId, status);
            res.json({ success: true, video: updated });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Get video notes
     */
    router.get('/api/videos/:id/notes', (req, res, next) => {
        try {
            const videoId = parseInt(req.params.id, 10);
            const notes = notesService.getNotes(videoId);
            res.json(notes);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Save video notes
     */
    router.post('/api/videos/:id/notes', express.json(), (req, res, next) => {
        try {
            const videoId = parseInt(req.params.id, 10);
            const { content } = req.body;

            const notes = notesService.saveNotes(videoId, content);
            res.json({ success: true, notes });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Search API endpoint
     */
    router.get('/api/search', (req, res) => {
        const query = req.query.q || '';
        const results = query ? videoService.searchVideos(query) : [];
        res.json(results);
    });

    /**
     * Get course stats
     */
    router.get('/api/stats', (req, res) => {
        const stats = videoService.getStats();
        res.json(stats);
    });

    return router;
}

module.exports = { createVideoRoutes };
