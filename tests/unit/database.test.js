/**
 * Database Manager Tests
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { DatabaseManager } = require('../../src/models/database');

describe('DatabaseManager', () => {
    let tempDir;
    let db;

    beforeEach(() => {
        // Create a temp directory for each test
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coursewatcher-test-'));
    });

    afterEach(() => {
        // Close database and clean up
        if (db) {
            db.close();
            db = null;
        }
        // Remove temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    describe('initialize', () => {
        test('should create .coursewatcher folder', () => {
            db = new DatabaseManager(tempDir);
            db.initialize();

            const dataFolder = path.join(tempDir, '.coursewatcher');
            expect(fs.existsSync(dataFolder)).toBe(true);
        });

        test('should create database file', () => {
            db = new DatabaseManager(tempDir);
            db.initialize();

            const dbPath = path.join(tempDir, '.coursewatcher', 'database.sqlite');
            expect(fs.existsSync(dbPath)).toBe(true);
        });

        test('should create tables', () => {
            db = new DatabaseManager(tempDir);
            db.initialize();

            // Check that tables exist
            const tables = db.all(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            );
            const tableNames = tables.map(t => t.name);

            expect(tableNames).toContain('modules');
            expect(tableNames).toContain('videos');
            expect(tableNames).toContain('notes');
        });
    });

    describe('query methods', () => {
        beforeEach(() => {
            db = new DatabaseManager(tempDir);
            db.initialize();
        });

        test('run() should insert data', () => {
            const result = db.run(
                'INSERT INTO modules (name, path) VALUES (?, ?)',
                ['Test Module', '/test/path']
            );

            expect(result.lastInsertRowid).toBe(1);
            expect(result.changes).toBe(1);
        });

        test('get() should return single row', () => {
            db.run(
                'INSERT INTO modules (name, path) VALUES (?, ?)',
                ['Test Module', '/test/path']
            );

            const row = db.get('SELECT * FROM modules WHERE id = ?', [1]);

            expect(row).toBeDefined();
            expect(row.name).toBe('Test Module');
        });

        test('all() should return multiple rows', () => {
            db.run('INSERT INTO modules (name, path) VALUES (?, ?)', ['Module 1', '/path1']);
            db.run('INSERT INTO modules (name, path) VALUES (?, ?)', ['Module 2', '/path2']);

            const rows = db.all('SELECT * FROM modules ORDER BY id');

            expect(rows).toHaveLength(2);
            expect(rows[0].name).toBe('Module 1');
            expect(rows[1].name).toBe('Module 2');
        });

        test('transaction() should commit on success', () => {
            db.transaction(() => {
                db.run('INSERT INTO modules (name, path) VALUES (?, ?)', ['Module 1', '/path1']);
                db.run('INSERT INTO modules (name, path) VALUES (?, ?)', ['Module 2', '/path2']);
            });

            const count = db.get('SELECT COUNT(*) as count FROM modules');
            expect(count.count).toBe(2);
        });

        test('transaction() should rollback on error', () => {
            try {
                db.transaction(() => {
                    db.run('INSERT INTO modules (name, path) VALUES (?, ?)', ['Module 1', '/path1']);
                    throw new Error('Test error');
                });
            } catch (e) {
                // Expected
            }

            const count = db.get('SELECT COUNT(*) as count FROM modules');
            expect(count.count).toBe(0);
        });
    });

    describe('close', () => {
        test('should close database connection', () => {
            db = new DatabaseManager(tempDir);
            db.initialize();
            db.close();

            // Should be able to reinitialize
            db = new DatabaseManager(tempDir);
            db.initialize();
            expect(db).toBeDefined();
        });
    });
});
