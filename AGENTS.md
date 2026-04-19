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
npm test
npm test -- --runInBand
```

CLI entrypoint:

```bash
node src/cli.js [path] [--port <number>] [--no-browser]
```

Published package:

```bash
npm install -g coursewatcher
coursewatcher --version
```

## Architecture

- `src/cli.js`: commander-based CLI entrypoint
- `src/server.js`: Express app setup and server lifecycle
- `src/controllers/`: route handlers and page rendering
- `src/services/`: app business logic
- `src/models/database.js`: SQLite setup and query helpers
- `views/`: EJS pages, layouts, partials
- `public/`: browser JS and CSS
- `tests/unit/`: service and database tests
- `tests/integration/`: HTTP/API and rendered-page tests

## Coding Guidelines

- Match existing CommonJS style and 2-space indentation.
- Use single quotes and semicolons.
- Keep changes surgical. Do not refactor unrelated code.
- Put business rules in services/controllers, not templates.
- Prefer small helpers over spreading conditionals across EJS.
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
npm test -- --runInBand tests/unit/progress-service.test.js tests/integration/api.test.js
```

- Run full `npm test -- --runInBand` before finishing non-trivial changes.

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
