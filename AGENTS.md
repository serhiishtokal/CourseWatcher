# AGENTS.md

## Project Overview

CourseWatcher is a Node.js CLI + local web app for tracking progress in downloaded video
courses. It scans a course folder, stores metadata in a local SQLite database inside
`.coursewatcher`, and serves an Express + EJS interface for playback, notes, search, and
progress tracking.

## Key Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm test
```

CLI entrypoint:

```bash
node dist/app/cli/main.js [path] [--port <number>] [--no-browser]
```

Published package:

```bash
npm install -g coursewatcher
coursewatcher --version
```

## Architecture

- `src/app/cli/`: TypeScript CLI entrypoint and server bootstrap
- `src/app/server/`: Express app wiring, API routes, and SPA hosting
- `src/modules/`: vertical slices for `catalog`, `playback`, and `notes`
- `src/platform/`: config, database, logging, and shared runtime concerns
- `src/shared/contracts/`: shared API DTOs used by backend and React app
- `web/src/`: Vite + React + TypeScript frontend, organized by feature
- `tests/unit/`: TypeScript unit tests for database and slice services
- `tests/integration/`: HTTP/API and SPA-shell integration tests

## Coding Guidelines

- Match existing 2-space indentation.
- Use single quotes and semicolons.
- Keep changes surgical. Do not refactor unrelated code.
- Put business rules in slice services, not route handlers or React components.
- Prefer small helpers over spreading conditionals across route components.
- Add tests for behavior changes, especially playback/progress logic.

## Progress And Player Rules

- Progress state lives in the `videos` table: `status`, `position`, `duration`.
- Playback start position is derived server-side before rendering the player page.
- Completed videos should reopen from the beginning.
- Short videos under `config.shortVideoResumeCutoffSeconds` should not persist partial
  resume position, but they still auto-update status.
- Be careful when changing `ProgressService.updatePosition()`: it affects cards, stats,
  rendered player state, and API responses.

## Testing Expectations

- Run focused tests when changing progress/player logic:

```bash
npm test
```

- Run `npm run typecheck`, `npm test`, and `npm run build` before finishing non-trivial changes.

## Release Notes

- Package name: `coursewatcher`
- Current published flow:
  1. update code
  2. run tests
  3. bump version in `package.json` and `package-lock.json`
  4. commit changes
  5. `npm publish` (may require `--otp=<code>`)

## Repo Notes

- `.coursewatcher/` is runtime data and should not be committed.
- Real-world validation is useful for playback changes because browser/player behavior can
  differ from pure unit tests.
