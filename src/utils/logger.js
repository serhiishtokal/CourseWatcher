/**
 * Logger Utility
 * 
 * Provides consistent console output with colored prefixes.
 * 
 * @module utils/logger
 */

const chalk = require('chalk');

/**
 * Log an informational message
 * @param {string} message - Message to log
 */
function log(message) {
    console.log(chalk.blue('ℹ'), message);
}

/**
 * Log a success message
 * @param {string} message - Message to log
 */
function success(message) {
    console.log(chalk.green('✓'), message);
}

/**
 * Log an error message
 * @param {string} message - Message to log
 */
function error(message) {
    console.error(chalk.red('✗'), message);
}

/**
 * Log a warning message
 * @param {string} message - Message to log
 */
function warn(message) {
    console.warn(chalk.yellow('⚠'), message);
}

module.exports = {
    log,
    success,
    error,
    warn,
};
