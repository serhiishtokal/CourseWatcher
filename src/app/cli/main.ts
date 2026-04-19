#!/usr/bin/env node

import { program } from 'commander';
import { getPackageInfo } from '../../platform/config/package-info';
import { error, log } from '../../platform/logging/logger';
import { getDefaultPort, resolveCoursePath, startServer } from '../server/start-server';

const packageInfo = getPackageInfo();

program
  .name('coursewatcher')
  .description(packageInfo.description)
  .version(packageInfo.version)
  .argument('[path]', 'path to course directory', '.')
  .option('-p, --port <number>', 'server port')
  .option('--no-browser', 'do not open browser automatically')
  .action(async (coursePath: string, options: { browser: boolean; port?: string }) => {
    try {
      const resolvedCoursePath = resolveCoursePath(coursePath);
      const isPortSpecified = typeof options.port === 'string';
      const portOption = options.port;
      const port = isPortSpecified && portOption ? Number.parseInt(portOption, 10) : getDefaultPort();

      log(`Starting CourseWatcher in: ${resolvedCoursePath}`);

      await startServer({
        coursePath: resolvedCoursePath,
        port,
        allowFallback: !isPortSpecified,
        openBrowser: options.browser,
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown error';
      error(`Failed to start CourseWatcher: ${message}`);
      process.exit(1);
    }
  });

void program.parseAsync();
