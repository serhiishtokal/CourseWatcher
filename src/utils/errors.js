/**
 * Custom Error Classes
 * 
 * Application-specific error types for better error handling.
 * 
 * @module utils/errors
 */

/**
 * Base error class for CourseWatcher
 */
class CourseWatcherError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CourseWatcherError';
    }
}

/**
 * Error thrown when a resource is not found
 */
class NotFoundError extends CourseWatcherError {
    constructor(resource) {
        super(`Not found: ${resource}`);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

/**
 * Error thrown for validation failures
 */
class ValidationError extends CourseWatcherError {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

/**
 * Error thrown for database operations
 */
class DatabaseError extends CourseWatcherError {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
        this.statusCode = 500;
    }
}

module.exports = {
    CourseWatcherError,
    NotFoundError,
    ValidationError,
    DatabaseError,
};
