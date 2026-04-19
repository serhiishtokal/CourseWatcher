# CourseWatcher

[![npm version](https://img.shields.io/npm/v/coursewatcher.svg)](https://www.npmjs.com/package/coursewatcher)
[![npm downloads](https://img.shields.io/npm/dm/coursewatcher.svg)](https://www.npmjs.com/package/coursewatcher)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


**A TypeScript CLI and React web app for tracking progress in downloaded video courses.**

## Quick Start

```bash
# Navigate to your course folder
cd /path/to/my-course

# Build once, then run CourseWatcher
npm run build
node dist/app/cli/main.js

# Or with options
node dist/app/cli/main.js --port 8080 --no-browser
```

## CLI Options

| Argument | Description | Default |
|----------|-------------|---------|
| `[path]` | Path to course directory | `.` (Current directory) |
| `-p, --port` | Port to run the server on | `3000` |
| `--no-browser` | Prevent browser from opening automatically | `false` |


## Installation

```bash
npm install -g coursewatcher
```

## Features

- 📺 **Video Tracking** — Automatically tracks watch status and playback position
- 📁 **Module Grouping** — Groups videos by folder structure
- 🎮 **Smart Player** — Keyboard shortcuts for speed/seek control
- 🔍 **Video Search** — Find videos by name
- 📝 **Notes** — Markdown notes for each video
- 💾 **Portable Data** — Progress stored in `.coursewatcher` folder next to videos

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `W` | Decrease speed |
| `E` | Increase speed |
| `J` | Seek back 5s |
| `K` | Seek forward 5s |
| `L` | Seek forward 10s |
| `Shift+J` | Seek back 30s |
| `Shift+L` | Seek forward 30s |
| `M` | Mute/Unmute |
| `F` | Fullscreen |

## Development

```bash
# Install dependencies
npm install

# Run the TypeScript CLI + Express server with Vite middleware
npm run dev

# Typecheck, test, and build
npm run typecheck
npm test
npm run build
```

## License

MIT
