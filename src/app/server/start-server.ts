import path from 'node:path';
import type { Server } from 'node:http';
import type { Socket } from 'node:net';
import open from 'open';
import { createCourseWatcherApp } from './create-app';
import { appConfig } from '../../platform/config/app-config';
import { DatabaseManager } from '../../platform/database/database-manager';
import { error, log, success } from '../../platform/logging/logger';

export interface ServerOptions {
  allowFallback: boolean;
  coursePath: string;
  openBrowser: boolean;
  port: number;
}

export async function startServer(options: ServerOptions): Promise<{
  database: DatabaseManager;
  server: Server;
}> {
  const database = new DatabaseManager(options.coursePath).initialize();
  const { app, services } = await createCourseWatcherApp(database);

  log('Scanning for video files...');
  const scanResult = services.catalogService.scanVideos();
  success(`Found ${scanResult.total} videos (${scanResult.added} new, ${scanResult.existing} existing)`);

  return new Promise((resolve, reject) => {
    const sockets = new Set<Socket>();

    const start = (port: number): void => {
      const server = app.listen(port, () => {
        const url = `http://localhost:${port}`;
        success(`Server running at ${url}`);

        if (options.openBrowser) {
          void open(url).catch(() => undefined);
        }

        server.on('connection', (socket) => {
          sockets.add(socket);
          socket.on('close', () => sockets.delete(socket));
        });

        const shutdown = (signal: NodeJS.Signals): void => {
          log(`Shutting down... (${signal})`);
          for (const socket of sockets) {
            socket.destroy();
          }

          database.close();
          server.close(() => {
            success('Server closed');
            process.exit(0);
          });
        };

        process.once('SIGINT', () => shutdown('SIGINT'));
        process.once('SIGTERM', () => shutdown('SIGTERM'));

        resolve({
          server,
          database,
        });
      });

      server.on('error', (caughtError: NodeJS.ErrnoException) => {
        if (caughtError.code === 'EADDRINUSE' && options.allowFallback) {
          log(`Port ${port} is busy, trying ${port + 1}...`);
          start(port + 1);
          return;
        }

        if (caughtError.code === 'EADDRINUSE') {
          error(`Port ${port} is already in use`);
        }

        reject(caughtError);
      });
    };

    start(options.port);
  });
}

export function resolveCoursePath(inputPath: string): string {
  return path.resolve(inputPath);
}

export function getDefaultPort(): number {
  return appConfig.defaultPort;
}
