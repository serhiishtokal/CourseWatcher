# CourseWatcher

**A CLI tool and web interface for tracking progress in downloaded video courses.**

## Quick Start

```bash
# Navigate to your course folder
cd /path/to/my-course

# Run CourseWatcher
npx coursewatcher

# Or with options
npx coursewatcher --port 8080 --no-browser
```

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

# Run in development
npm run dev

# Run tests
npm test
```

## License

MIT
