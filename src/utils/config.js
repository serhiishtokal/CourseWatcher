/**
 * Configuration Module
 * 
 * Centralized configuration with environment variable support and defaults.
 * 
 * @module utils/config
 */

const path = require('path');

const config = {
    // Server settings
    port: parseInt(process.env.PORT, 10) || 3000,

    // Database settings
    dbFolder: '.coursewatcher',
    dbFilename: 'database.sqlite',

    // Video settings
    videoExtensions: ['.mp4', '.webm', '.ogv', '.ogg'],
    completionThreshold: 0.9, // 90% watched = completed

    // Playback settings
    defaultPlaybackSpeed: 1.0,
    speedStep: 0.25,
    seekShort: 5,
    seekMedium: 10,
    seekLong: 30,

    // Progress auto-save interval (seconds)
    progressSaveInterval: 5,
};

/**
 * Get the database path for a given course directory
 * @param {string} coursePath - Path to the course directory
 * @returns {string} Full path to the database file
 */
function getDbPath(coursePath) {
    return path.join(coursePath, config.dbFolder, config.dbFilename);
}

/**
 * Get the .coursewatcher folder path
 * @param {string} coursePath - Path to the course directory
 * @returns {string} Full path to the .coursewatcher folder
 */
function getDataFolder(coursePath) {
    return path.join(coursePath, config.dbFolder);
}

module.exports = {
    config,
    getDbPath,
    getDataFolder,
};
