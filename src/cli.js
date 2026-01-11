#!/usr/bin/env node

/**
 * CourseWatcher CLI Entry Point
 * 
 * Main executable for the coursewatcher command.
 * Parses arguments and starts the web server.
 * 
 * @module cli
 */

const { program } = require('commander');
const path = require('path');
const { version, description } = require('../package.json');
const { startServer } = require('./server');
const { log, success, error } = require('./utils/logger');

program
    .name('coursewatcher')
    .description(description)
    .version(version)
    .argument('[path]', 'path to course directory', '.')
    .option('-p, --port <number>', 'server port')
    .option('--no-browser', 'do not open browser automatically')
    .action(async (coursePath, options) => {
        try {
            const absolutePath = path.resolve(coursePath);
            const isPortSpecified = !!options.port;
            const port = isPortSpecified ? parseInt(options.port, 10) : 3000;

            log(`Starting CourseWatcher in: ${absolutePath}`);

            await startServer({
                coursePath: absolutePath,
                port,
                allowFallback: !isPortSpecified,
                openBrowser: options.browser,
            });
        } catch (err) {
            error(`Failed to start CourseWatcher: ${err.message}`);
            process.exit(1);
        }
    });

program.parse();
