/**
 * Video Service Tests
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { DatabaseManager } = require('../../src/models/database');
const { VideoService } = require('../../src/services/video-service');

describe('VideoService', () => {
    let tempDir;
    let db;
    let videoService;

    beforeEach(() => {
        // Create a temp directory with video files for testing
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coursewatcher-test-'));

        // Create some mock video files
        fs.writeFileSync(path.join(tempDir, '01. Introduction.mp4'), '');
        fs.writeFileSync(path.join(tempDir, '02. Getting Started.mp4'), '');

        // Create a module folder with videos
        const moduleDir = path.join(tempDir, 'Module 1 - Basics');
        fs.mkdirSync(moduleDir);
        fs.writeFileSync(path.join(moduleDir, '01. First Lesson.mp4'), '');
        fs.writeFileSync(path.join(moduleDir, '02. Second Lesson.mp4'), '');

        // Initialize database and service
        db = new DatabaseManager(tempDir);
        db.initialize();
        videoService = new VideoService(db);
    });

    afterEach(() => {
        if (db) {
            db.close();
            db = null;
        }
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    describe('scanVideos', () => {
        test('should find all video files', () => {
            const result = videoService.scanVideos();

            expect(result.total).toBe(4);
            expect(result.added).toBe(4);
        });

        test('should not duplicate videos on rescan', () => {
            videoService.scanVideos();
            const result = videoService.scanVideos();

            expect(result.total).toBe(4);
            expect(result.added).toBe(0);
            expect(result.existing).toBe(4);
        });

        test('should create module from folder', () => {
            videoService.scanVideos();

            const modules = db.all('SELECT * FROM modules');
            expect(modules).toHaveLength(1);
            expect(modules[0].name).toBe('Module 1 - Basics');
        });

        test('should skip .coursewatcher folder', () => {
            // The .coursewatcher folder is created by database init
            const result = videoService.scanVideos();

            // Should only find videos in root and Module folder
            expect(result.total).toBe(4);
        });
    });

    describe('getAllModulesWithVideos', () => {
        beforeEach(() => {
            videoService.scanVideos();
        });

        test('should return modules with their videos', () => {
            const modules = videoService.getAllModulesWithVideos();

            expect(modules).toHaveLength(2); // Root videos + 1 module
        });

        test('should include root videos as pseudo-module', () => {
            const modules = videoService.getAllModulesWithVideos();
            const rootModule = modules.find(m => m.id === null);

            expect(rootModule).toBeDefined();
            expect(rootModule.name).toBe('Videos');
            expect(rootModule.videos).toHaveLength(2);
        });
    });

    describe('getVideoById', () => {
        beforeEach(() => {
            videoService.scanVideos();
        });

        test('should return video by ID', () => {
            const video = videoService.getVideoById(1);

            expect(video).toBeDefined();
            expect(video.id).toBe(1);
        });

        test('should throw NotFoundError for invalid ID', () => {
            expect(() => videoService.getVideoById(999)).toThrow('Not found');
        });
    });

    describe('searchVideos', () => {
        beforeEach(() => {
            videoService.scanVideos();
        });

        test('should find videos by title', () => {
            const results = videoService.searchVideos('Introduction');

            expect(results).toHaveLength(1);
            expect(results[0].title).toContain('Introduction');
        });

        test('should return empty array for no matches', () => {
            const results = videoService.searchVideos('nonexistent');

            expect(results).toHaveLength(0);
        });

        test('should be case insensitive', () => {
            const results = videoService.searchVideos('INTRODUCTION');

            expect(results).toHaveLength(1);
        });
    });

    describe('getStats', () => {
        beforeEach(() => {
            videoService.scanVideos();
        });

        test('should return correct statistics', () => {
            const stats = videoService.getStats();

            expect(stats.total).toBe(4);
            expect(stats.completed).toBe(0);
            expect(stats.inProgress).toBe(0);
            expect(stats.unwatched).toBe(4);
            expect(stats.percentComplete).toBe(0);
        });
    });

    describe('getAdjacentVideos', () => {
        beforeEach(() => {
            videoService.scanVideos();
        });

        test('should return prev and next video IDs', () => {
            // Get videos to find their IDs
            const modules = videoService.getAllModulesWithVideos();
            const rootVideos = modules.find(m => m.id === null).videos;

            if (rootVideos.length >= 2) {
                const adjacent = videoService.getAdjacentVideos(rootVideos[0].id);

                expect(adjacent.prev).toBeNull();
                expect(adjacent.next).toBe(rootVideos[1].id);
            }
        });
    });
});
