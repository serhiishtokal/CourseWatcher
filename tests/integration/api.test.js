/**
 * API Integration Tests
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const express = require('express');
const request = require('supertest');

const { DatabaseManager } = require('../../src/models/database');
const { VideoService } = require('../../src/services/video-service');
const { ProgressService } = require('../../src/services/progress-service');
const { NotesService } = require('../../src/services/notes-service');
const { createVideoRoutes } = require('../../src/controllers/video-controller');

describe('API Endpoints', () => {
    let tempDir;
    let db;
    let app;
    let testVideoId;
    let secondVideoId;

    beforeEach(() => {
        // Create temp directory with video files
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coursewatcher-test-'));
        fs.writeFileSync(path.join(tempDir, '01. Test Video.mp4'), 'dummy content');
        fs.writeFileSync(path.join(tempDir, '02. Another Video.mp4'), 'dummy content');

        // Initialize database and services
        db = new DatabaseManager(tempDir);
        db.initialize();

        const videoService = new VideoService(db);
        const progressService = new ProgressService(db);
        const notesService = new NotesService(db);

        // Scan videos
        videoService.scanVideos();
        const videos = db.all('SELECT id FROM videos ORDER BY id');
        testVideoId = videos[0].id;
        secondVideoId = videos[1].id;

        // Create Express app
        app = express();
        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, '../../views'));
        app.use('/', createVideoRoutes({
            videoService,
            progressService,
            notesService,
        }));

        // Error handler for tests
        app.use((err, req, res, next) => {
            res.status(err.statusCode || 500).json({ error: err.message });
        });
    });

    afterEach(() => {
        if (db) {
            db.close();
            db = null;
        }
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    describe('GET /api/stats', () => {
        test('should return course statistics', async () => {
            const res = await request(app).get('/api/stats');

            expect(res.status).toBe(200);
            expect(res.body.total).toBe(2);
            expect(res.body.completed).toBe(0);
            expect(res.body.percentComplete).toBe(0);
        });
    });

    describe('GET /video/:id', () => {
        test('should start completed videos from the beginning', async () => {
            db.run(
                'UPDATE videos SET position = ?, duration = ?, status = ? WHERE id = ?',
                [540, 600, 'completed', testVideoId]
            );

            const res = await request(app).get(`/video/${testVideoId}`);

            expect(res.status).toBe(200);
            expect(res.text).toContain('data-start-position="0"');
        });

        test('should start short in-progress videos from the beginning', async () => {
            db.run(
                'UPDATE videos SET position = ?, duration = ?, status = ? WHERE id = ?',
                [120, 240, 'in-progress', testVideoId]
            );

            const res = await request(app).get(`/video/${testVideoId}`);

            expect(res.status).toBe(200);
            expect(res.text).toContain('data-start-position="0"');
        });

        test('should resume long in-progress videos from saved position', async () => {
            db.run(
                'UPDATE videos SET position = ?, duration = ?, status = ? WHERE id = ?',
                [120, 600, 'in-progress', secondVideoId]
            );

            const res = await request(app).get(`/video/${secondVideoId}`);

            expect(res.status).toBe(200);
            expect(res.text).toContain('data-start-position="120"');
        });
    });

    describe('GET /api/search', () => {
        test('should return matching videos', async () => {
            const res = await request(app).get('/api/search?q=Test');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].title).toContain('Test');
        });

        test('should return empty for no matches', async () => {
            const res = await request(app).get('/api/search?q=nonexistent');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(0);
        });
    });

    describe('POST /api/videos/:id/progress', () => {
        test('should update video progress', async () => {
            const res = await request(app)
                .post(`/api/videos/${testVideoId}/progress`)
                .send({ position: 120, duration: 600 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.video.position).toBe(120);
        });

        test('should return 404 for invalid video ID', async () => {
            const res = await request(app)
                .post('/api/videos/999/progress')
                .send({ position: 120 });

            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/videos/:id/status', () => {
        test('should update video status', async () => {
            const res = await request(app)
                .post(`/api/videos/${testVideoId}/status`)
                .send({ status: 'completed' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.video.status).toBe('completed');
        });

        test('should return 400 for invalid status', async () => {
            const res = await request(app)
                .post(`/api/videos/${testVideoId}/status`)
                .send({ status: 'invalid' });

            expect(res.status).toBe(400);
        });
    });

    describe('Notes API', () => {
        test('GET /api/videos/:id/notes should return notes', async () => {
            const res = await request(app).get(`/api/videos/${testVideoId}/notes`);

            expect(res.status).toBe(200);
            expect(res.body.content).toBe('');
        });

        test('POST /api/videos/:id/notes should save notes', async () => {
            const res = await request(app)
                .post(`/api/videos/${testVideoId}/notes`)
                .send({ content: '# My Notes\n\nSome content here.' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.notes.content).toContain('My Notes');
        });

        test('notes should persist', async () => {
            await request(app)
                .post(`/api/videos/${testVideoId}/notes`)
                .send({ content: 'Test content' });

            const res = await request(app).get(`/api/videos/${testVideoId}/notes`);

            expect(res.body.content).toBe('Test content');
        });
    });
});
