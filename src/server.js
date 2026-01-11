/**
 * Express Server
 * 
 * Main server configuration and startup.
 * 
 * @module server
 */

const express = require('express');
const path = require('path');
const open = require('open');

const { DatabaseManager } = require('./models/database');
const { VideoService } = require('./services/video-service');
const { ProgressService } = require('./services/progress-service');
const { NotesService } = require('./services/notes-service');
const { createVideoRoutes } = require('./controllers/video-controller');
const { log, success, error } = require('./utils/logger');
const chalk = require('chalk');

/**
 * Start the CourseWatcher server
 * @param {Object} options - Server options
 * @param {string} options.coursePath - Path to course directory
 * @param {number} options.port - Server port
 * @param {boolean} options.openBrowser - Whether to open browser
 * @returns {Promise<Object>} Server instance and services
 */
async function startServer(options) {
    const { coursePath, port, openBrowser } = options;

    // Initialize database
    log('Initializing database...');
    const database = new DatabaseManager(coursePath);
    database.initialize();

    // Create services
    const videoService = new VideoService(database);
    const progressService = new ProgressService(database);
    const notesService = new NotesService(database);

    // Scan for videos
    log('Scanning for video files...');
    const scanResult = videoService.scanVideos();
    success(`Found ${scanResult.total} videos (${scanResult.added} new, ${scanResult.existing} existing)`);

    // Create Express app
    const app = express();

    // Configure EJS
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '..', 'views'));

    // Static files
    app.use('/static', express.static(path.join(__dirname, '..', 'public')));
    app.use('/lib/plyr', express.static(path.join(__dirname, '..', 'node_modules', 'plyr', 'dist')));

    // Routes
    app.use('/', createVideoRoutes({
        videoService,
        progressService,
        notesService,
    }));

    // Error handling middleware
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';

        // Log error in development
        if (process.env.NODE_ENV !== 'production') {
            error(`${err.name}: ${message}`);
            if (err.stack) {
                console.error(err.stack);
            }
        }

        // API errors return JSON
        if (req.path.startsWith('/api/')) {
            return res.status(statusCode).json({
                error: true,
                message,
            });
        }

        // Page errors render error page
        res.status(statusCode).render('pages/error', {
            title: 'Error',
            statusCode,
            message,
        });
    });

    // Start server
    return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            const url = `http://localhost:${port}`;
            success(`Server running at ${chalk.cyan(url)}`);

            // Open browser if requested
            if (openBrowser) {
                log('Opening browser...');
                open(url).catch(() => {
                    // Ignore browser open errors
                });
            }

            // Track active connections
            const sockets = new Set();
            server.on('connection', (socket) => {
                sockets.add(socket);
                server.once('close', () => sockets.delete(socket));
            });

            // Handle graceful shutdown
            let isShuttingDown = false;
            const shutdown = async (signal) => {
                if (isShuttingDown) return;
                isShuttingDown = true;

                log(`\nShutting down... (${signal})`);

                // Force exit after timeout if graceful shutdown fails
                const forceExitTimeout = setTimeout(() => {
                    error('Forced shutdown after timeout');
                    process.exit(1);
                }, 5000);

                // Destroy all active connections
                for (const socket of sockets) {
                    socket.destroy();
                    sockets.delete(socket);
                }

                database.close();
                server.close(() => {
                    clearTimeout(forceExitTimeout);
                    success('Server closed');
                    process.exit(0);
                });
            };

            process.on('SIGINT', () => shutdown('SIGINT'));
            process.on('SIGTERM', () => shutdown('SIGTERM'));

            resolve({
                server,
                database,
                services: {
                    videoService,
                    progressService,
                    notesService,
                },
            });
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                error(`Port ${port} is already in use`);
            }
            reject(err);
        });
    });
}

module.exports = { startServer };
