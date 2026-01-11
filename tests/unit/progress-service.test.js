/**
 * Progress Service Tests
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { DatabaseManager } = require('../../src/models/database');
const { VideoService } = require('../../src/services/video-service');
const { ProgressService } = require('../../src/services/progress-service');

describe('ProgressService', () => {
    let tempDir;
    let db;
    let videoService;
    let progressService;
    let testVideoId;

    beforeEach(() => {
        // Create temp directory with a video file
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coursewatcher-test-'));
        fs.writeFileSync(path.join(tempDir, '01. Test Video.mp4'), '');

        // Initialize services
        db = new DatabaseManager(tempDir);
        db.initialize();
        videoService = new VideoService(db);
        progressService = new ProgressService(db);

        // Scan and get video ID
        videoService.scanVideos();
        const video = db.get('SELECT id FROM videos LIMIT 1');
        testVideoId = video.id;
    });

    afterEach(() => {
        if (db) {
            db.close();
            db = null;
        }
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    describe('updatePosition', () => {
        test('should update position', () => {
            const result = progressService.updatePosition(testVideoId, 120, 600);

            expect(result.position).toBe(120);
            expect(result.duration).toBe(600);
        });

        test('should set status to in-progress when position > 0', () => {
            const result = progressService.updatePosition(testVideoId, 60, 600);

            expect(result.status).toBe('in-progress');
        });

        test('should set status to completed at 90% threshold', () => {
            const result = progressService.updatePosition(testVideoId, 540, 600);

            expect(result.status).toBe('completed');
        });

        test('should throw ValidationError for negative position', () => {
            expect(() => progressService.updatePosition(testVideoId, -10)).toThrow();
        });

        test('should throw NotFoundError for invalid video ID', () => {
            expect(() => progressService.updatePosition(999, 60)).toThrow('Not found');
        });
    });

    describe('updateStatus', () => {
        test('should update status to completed', () => {
            const result = progressService.updateStatus(testVideoId, 'completed');

            expect(result.status).toBe('completed');
        });

        test('should reset position when marking as unwatched', () => {
            // First set some progress
            progressService.updatePosition(testVideoId, 120, 600);

            // Then mark as unwatched
            const result = progressService.updateStatus(testVideoId, 'unwatched');

            expect(result.status).toBe('unwatched');
            expect(result.position).toBe(0);
        });

        test('should throw ValidationError for invalid status', () => {
            expect(() => progressService.updateStatus(testVideoId, 'invalid')).toThrow(
                'Invalid status'
            );
        });
    });

    describe('markCompleted', () => {
        test('should mark video as completed', () => {
            const result = progressService.markCompleted(testVideoId);

            expect(result.status).toBe('completed');
        });
    });

    describe('markUnwatched', () => {
        test('should mark video as unwatched', () => {
            // First mark as completed
            progressService.markCompleted(testVideoId);

            // Then mark as unwatched
            const result = progressService.markUnwatched(testVideoId);

            expect(result.status).toBe('unwatched');
        });
    });

    describe('getProgress', () => {
        test('should return progress info', () => {
            progressService.updatePosition(testVideoId, 300, 600);

            const progress = progressService.getProgress(testVideoId);

            expect(progress.position).toBe(300);
            expect(progress.duration).toBe(600);
            expect(progress.percentWatched).toBe(50);
        });
    });
});
