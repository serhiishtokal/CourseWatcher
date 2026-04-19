import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { CatalogRepository } from '../../modules/catalog/catalog-repository';
import { CatalogService } from '../../modules/catalog/catalog-service';
import { NotesRepository } from '../../modules/notes/notes-repository';
import { NotesService } from '../../modules/notes/notes-service';
import { PlaybackRepository } from '../../modules/playback/playback-repository';
import { PlaybackService } from '../../modules/playback/playback-service';
import { appConfig } from '../../platform/config/app-config';
import { DatabaseManager } from '../../platform/database/database-manager';
import { AppError } from '../../platform/errors/app-error';
import { error as logError } from '../../platform/logging/logger';

export interface AppServices {
  catalogService: CatalogService;
  notesService: NotesService;
  playbackService: PlaybackService;
}

export async function createCourseWatcherApp(
  database: DatabaseManager,
): Promise<{ app: Express; services: AppServices }> {
  const catalogRepository = new CatalogRepository(database);
  const notesRepository = new NotesRepository(database);
  const playbackRepository = new PlaybackRepository(database);

  const notesService = new NotesService(notesRepository);
  const playbackService = new PlaybackService(playbackRepository, catalogRepository);
  const catalogService = new CatalogService(catalogRepository, playbackService, notesService);

  const app = express();
  app.use(express.json());

  app.get('/api/catalog', (request, response) => {
    response.json(catalogService.getCatalog(getQueryValue(request.query.sort)));
  });

  app.get('/api/stats', (_request, response) => {
    response.json(catalogService.getStats());
  });

  app.get('/api/search', (request, response) => {
    response.json(catalogService.searchVideos(getQueryValue(request.query.q) ?? ''));
  });

  app.get('/api/videos/:id', (request, response) => {
    response.json(catalogService.getPlayerPayload(getNumericRouteParam(request.params.id)));
  });

  app.get('/api/videos/:id/stream', (request, response) => {
    response.sendFile(catalogService.getVideoPath(getNumericRouteParam(request.params.id)));
  });

  app.post('/api/videos/:id/progress', (request, response) => {
    const videoId = getNumericRouteParam(request.params.id);
    const { duration, position } = request.body as { duration?: number; position?: number };
    response.json(playbackService.updatePosition(videoId, position ?? 0, duration ?? null));
  });

  app.post('/api/videos/:id/status', (request, response) => {
    const videoId = getNumericRouteParam(request.params.id);
    const { status } = request.body as { status?: 'unwatched' | 'in-progress' | 'completed' };
    response.json(playbackService.updateStatus(videoId, status ?? 'unwatched'));
  });

  app.get('/api/videos/:id/notes', (request, response) => {
    response.json(notesService.getNotes(getNumericRouteParam(request.params.id)));
  });

  app.post('/api/videos/:id/notes', (request, response) => {
    const videoId = getNumericRouteParam(request.params.id);
    const { content } = request.body as { content?: string };
    response.json({
      success: true as const,
      notes: notesService.saveNotes(videoId, content ?? ''),
    });
  });

  await registerWebApplication(app);

  app.use((caughtError: unknown, request: Request, response: Response, _next: NextFunction) => {
    const appError = normalizeError(caughtError);
    if (process.env.NODE_ENV !== 'production') {
      logError(`${appError.name}: ${appError.message}`);
      if (appError.stack) {
        console.error(appError.stack);
      }
    }

    if (request.path.startsWith('/api/')) {
      response.status(appError.statusCode).json({
        error: true,
        message: appError.message,
      });
      return;
    }

    response.status(appError.statusCode).send(appError.message);
  });

  return {
    app,
    services: {
      catalogService,
      notesService,
      playbackService,
    },
  };
}

function getNumericRouteParam(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new AppError('Invalid route parameter', 400);
  }

  return parsed;
}

function getQueryValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeError(caughtError: unknown): AppError {
  if (caughtError instanceof AppError) {
    return caughtError;
  }

  if (caughtError instanceof Error) {
    return new AppError(caughtError.message, 500);
  }

  return new AppError('Internal Server Error', 500);
}

async function registerWebApplication(app: Express): Promise<void> {
  if (appConfig.isDevelopment) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      configFile: path.resolve(process.cwd(), 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);
    app.use(async (request, response, next) => {
      if (request.path.startsWith('/api/')) {
        next();
        return;
      }

      try {
        const templatePath = path.resolve(process.cwd(), 'web/index.html');
        const template = await fsp.readFile(templatePath, 'utf8');
        const html = await vite.transformIndexHtml(request.originalUrl, template);
        response.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (caughtError) {
        next(caughtError);
      }
    });

    return;
  }

  const webDistPath = path.resolve(process.cwd(), 'dist/web');
  app.use(express.static(webDistPath));
  app.use((request, response, next) => {
    if (request.path.startsWith('/api/')) {
      next();
      return;
    }

    const indexPath = path.join(webDistPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      response.status(200).type('html').send('<!doctype html><html><body><div id="root"></div></body></html>');
      return;
    }

    response.sendFile(indexPath);
  });
}
