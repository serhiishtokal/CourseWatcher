/**
 * Database Module
 * 
 * SQLite database connection manager using better-sqlite3.
 * Handles schema creation and provides query methods.
 * 
 * @module models/database
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { getDbPath, getDataFolder } = require('../utils/config');
const { DatabaseError } = require('../utils/errors');

/**
 * Database manager class
 */
class DatabaseManager {
    /**
     * Create a new DatabaseManager
     * @param {string} coursePath - Path to the course directory
     */
    constructor(coursePath) {
        this._coursePath = coursePath;
        this._db = null;
    }

    /**
     * Initialize the database connection and create schema
     * @returns {DatabaseManager} This instance for chaining
     */
    initialize() {
        try {
            // Ensure .coursewatcher folder exists
            const dataFolder = getDataFolder(this._coursePath);
            if (!fs.existsSync(dataFolder)) {
                fs.mkdirSync(dataFolder, { recursive: true });
            }

            // Open database connection
            const dbPath = getDbPath(this._coursePath);
            this._db = new Database(dbPath);

            // Enable foreign keys
            this._db.pragma('foreign_keys = ON');

            // Create schema
            this._createSchema();

            return this;
        } catch (err) {
            throw new DatabaseError(`Failed to initialize database: ${err.message}`);
        }
    }

    /**
     * Create database schema
     * @private
     */
    _createSchema() {
        // Modules table
        this._db.exec(`
      CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Videos table
        this._db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        title TEXT NOT NULL,
        duration REAL DEFAULT 0,
        position REAL DEFAULT 0,
        status TEXT CHECK(status IN ('unwatched', 'in-progress', 'completed')) DEFAULT 'unwatched',
        module_id INTEGER,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
      )
    `);

        // Notes table
        this._db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER NOT NULL UNIQUE,
        content TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
      )
    `);

        // Create indexes
        this._db.exec(`
      CREATE INDEX IF NOT EXISTS idx_videos_module ON videos(module_id);
      CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
      CREATE INDEX IF NOT EXISTS idx_videos_path ON videos(path);
    `);
    }

    /**
     * Get a single row from a query
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Object|undefined} The row or undefined
     */
    get(sql, params = []) {
        return this._db.prepare(sql).get(...params);
    }

    /**
     * Get all rows from a query
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Array} Array of rows
     */
    all(sql, params = []) {
        return this._db.prepare(sql).all(...params);
    }

    /**
     * Run an insert/update/delete query
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Object} Result with changes and lastInsertRowid
     */
    run(sql, params = []) {
        return this._db.prepare(sql).run(...params);
    }

    /**
     * Run multiple statements in a transaction
     * @param {Function} fn - Function containing database operations
     * @returns {*} Result of the transaction function
     */
    transaction(fn) {
        return this._db.transaction(fn)();
    }

    /**
     * Close the database connection
     */
    close() {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    }

    /**
     * Get the course path
     * @returns {string} The course path
     */
    getCoursePath() {
        return this._coursePath;
    }
}

module.exports = { DatabaseManager };
