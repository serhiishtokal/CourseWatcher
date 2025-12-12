# CourseWatcher

**A CLI tool and web interface for tracking progress in downloaded video courses.**

Unlike generic media players, CourseWatcher understands "courses" as structured content with modules and lessons. It persistently tracks your progress, completion status, and notes — all stored locally alongside your video files.

---

## Core Philosophy

| Principle | Description |
|-----------|-------------|
| **Portable Data** | All data (progress, notes, config) lives in a `.coursewatcher` folder next to your videos. Move the entire course folder to another drive, and your progress moves with it. |
| **SQLite-First** | Uses a robust, local SQLite database for reliability and complex querying. |
| **Resume-First** | The player always remembers exactly where you left off. |

---

## Key Features

- **Video Tracking** — Automatically tracks watch status (unwatched, in-progress, completed) and precise playback position
- **Module Grouping** — Intelligently groups videos into modules based on folder structure
- **Smart Web Player** — A dedicated local web interface with advanced playback controls
- **Video Search** — Quickly find videos by name across all modules
- **Notes System** — Take Markdown-formatted notes for each video
- **CLI Management** — View status, list videos, and manage progress from the terminal

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js |
| **Frontend** | Server-side rendered HTML (EJS templates) + Vanilla JavaScript |
| **Database** | SQLite |
| **CLI Framework** | Node.js-based CLI |
| **Packaging** | npm package + standalone Windows executable |

### Why Server-Side Rendering?

This is a **local-only tool** running on `localhost`. Server-side rendered HTML offers:
- ✅ **Simpler architecture** — No build step, no bundling complexity
- ✅ **Smaller executable** — No React/Vite overhead in the final package
- ✅ **Faster startup** — No dev server or client-side hydration
- ✅ **Easier maintenance** — Plain HTML/JS is universally understood

---

## Supported Platforms

| Platform | Status |
|----------|--------|
| Windows | ✅ Supported |
| macOS | 🔜 Planned |
| Linux | 🔜 Planned |

---

## Supported Video Formats

All formats supported by modern browsers:
- **MP4** (H.264, H.265)
- **WebM** (VP8, VP9)
- **Ogg** (Theora)

---

## CLI Usage

### Basic Usage

```bash
coursewatcher
```

That's it. Run this command in any folder containing video files.

### What Happens Automatically

1. ✅ Creates `.coursewatcher` folder if it doesn't exist
2. ✅ Scans for video files and builds the database
3. ✅ Starts a local web server
4. ✅ Opens the interface in your default browser
5. ✅ Displays the URL in console for manual access

### Optional Flags

| Flag | Description |
|------|-------------|
| `--port <number>` | Use a custom port (default: 3000) |
| `--help` | Show help information |

---

## Web Interface Features

### Video Management
- Browse modules and videos in a structured view
- Search videos by name
- Play, pause, and resume videos
- Mark videos as watched, unwatched, or in-progress

### Notes
- Per-video notes with Markdown support
- Notes stored in the `.coursewatcher` folder

### Playback Controls

#### Speed Control
| Key | Action |
|-----|--------|
| `W` | Decrease playback speed |
| `E` | Increase playback speed |

#### Position Control
| Key | Action |
|-----|--------|
| `J` | Seek backward (default: 5 seconds) |
| `K` | Seek forward (default: 5 seconds) |
| `L` | Seek forward (default: 10 seconds) |
| `Shift + J` | Seek backward (default: 30 seconds) |
| `Shift + L` | Seek forward (default: 30 seconds) |

*All keyboard shortcuts also have corresponding UI buttons.*

---

## Configuration

CourseWatcher supports the following configurable options:

| Setting | Description |
|---------|-------------|
| **Playback Speed Steps** | Increment/decrement values for speed control |
| **Seek Intervals** | Customizable seek durations for position controls |
| **Default Playback Speed** | Initial playback speed when starting a video |
| **Keybindings** | Remap keyboard shortcuts to your preference |

---

## Installation

### Via npm (Recommended)

```bash
npm install -g coursewatcher
```

### Standalone Executable

Download the latest Windows executable from the [Releases](https://github.com/your-repo/coursewatcher/releases) page.

---

## Quick Start

```bash
# Navigate to your course folder
cd /path/to/my-course

# Run CourseWatcher
coursewatcher
```

That's all you need. The web interface will open automatically.

---

## Roadmap

| Feature | Status |
|---------|--------|
| Core CLI & Web Interface | 🔨 In Development |
| npm Package Publishing | 📋 Planned |
| Windows Executable | 📋 Planned |
| AI Video Summarization (Google Gemini) | 🔮 Future |

---

## License

This project is licensed under the [MIT License](../LICENSE) — free to use by anyone for any purpose.
