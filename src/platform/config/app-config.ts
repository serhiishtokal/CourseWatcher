import path from 'node:path';

export const appConfig = {
  dbFolder: '.coursewatcher',
  dbFilename: 'database.sqlite',
  videoExtensions: ['.mp4', '.webm', '.ogv', '.ogg'] as readonly string[],
  completionThreshold: 0.9,
  shortVideoResumeCutoffSeconds: 300,
  defaultPort: 3000,
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

export function getDataFolder(coursePath: string): string {
  return path.join(coursePath, appConfig.dbFolder);
}

export function getDbPath(coursePath: string): string {
  return path.join(getDataFolder(coursePath), appConfig.dbFilename);
}
