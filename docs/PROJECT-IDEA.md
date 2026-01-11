# CourseWatcher — Product Vision & Requirements

**A personal video course player built for self-paced learners who want a YouTube-like watching experience for their downloaded course libraries.**

---

## The Problem

Millions of people download video courses from platforms like Udemy, Coursera, LinkedIn Learning, or bootcamp recordings. However, watching these courses using generic media players (VLC, Windows Media Player) creates significant friction:

| Pain Point | Impact |
|------------|--------|
| **Lost Progress** | No memory of where you stopped watching — you waste time scrubbing through videos to find your position |
| **No Course Structure** | A folder of 50+ MP4 files with no organization, making navigation overwhelming |
| **Clunky Playback Controls** | Most players lack keyboard shortcuts for speed control and quick seeking that learners rely on |
| **Scattered Notes** | Taking notes externally (Notion, text files) disconnects learning context from the video |
| **No Completion Tracking** | No visual indicator of what you've watched, what's in progress, or what's next |

**The result**: Learners abandon courses, lose momentum, and feel frustrated by tools not designed for education.

---

## The Solution: CourseWatcher

CourseWatcher is a **lightweight, local-first course player** that transforms any folder of video files into a structured learning experience — complete with persistent progress, module organization, playback controls, and per-video notes.

### Core Value Proposition

> **"Turn your downloaded video folder into a personalized learning platform — with progress that never gets lost."**

---

## Target Users

### Primary Persona: The Self-Paced Learner

- **Who they are**: Software developers, students, professionals consuming technical content
- **What they do**: Download video courses and watch offline at their own pace
- **What they need**: 
  - A reliable way to track where they left off
  - Keyboard-driven playback controls (speed up, skip, rewind)
  - A clear overview of their learning progress
- **What frustrates them**: Generic media players that forget their position and offer no course-level tracking

### Secondary Persona: The Course Hoarder

- **Who they are**: Collectors of educational content who download courses "for later"
- **What they need**: A tool that makes starting (and finishing) courses less intimidating by showing clear progress
- **Motivation**: Visual completion tracking creates accountability and momentum

---

## Key Features

### 1. Persistent Progress Tracking

**What it does**: Automatically saves exactly where you stopped watching — down to the second — and resumes playback from that position when you return.

**Why it matters**: Eliminates the #1 frustration of watching downloaded courses. No more scrolling through video timelines to find your spot.

**How it works**:
- Progress auto-saves every few seconds while watching
- Automatic status transitions: `Unwatched → In Progress → Completed`
- Completion threshold configurable (e.g., mark complete at 95% watched)

---

### 2. Module-Based Organization

**What it does**: Automatically groups videos into modules based on folder structure, presenting content as a structured curriculum rather than a flat file list.

**Why it matters**: Online courses are organized into sections/chapters. CourseWatcher preserves this structure, making navigation intuitive and reducing cognitive overload.

**How it works**:
- Scans folder hierarchy and creates logical modules
- Supports nested folders for multi-level course structure
- Displays video count per module with collapsible sections

---

### 3. YouTube-Like Playback Controls

**What it does**: Provides keyboard shortcuts and UI buttons for common playback actions:

| Action | Keys |
|--------|------|
| Play/Pause | `Space` |
| Speed Down | `W` |
| Speed Up | `E` |
| Seek Back 5s | `J` or `←` |
| Seek Forward 5s | `K` or `→` |
| Seek Forward 10s | `L` |
| Long Seek Back 30s | `Shift + J` |
| Long Seek Forward 30s | `Shift + L` |
| Mute Toggle | `M` |
| Fullscreen Toggle | `F` |

**Why it matters**: Power users, especially developers, expect keyboard-driven control. Variable speed playback (0.25x to 4x) lets learners consume content faster or slow down for complex topics.

---

### 4. Per-Video Notes

**What it does**: Provides a Markdown-enabled notes editor attached to each video. Notes are saved automatically and persist with the course.

**Why it matters**: Learning is active, not passive. Taking notes during video lessons dramatically improves retention — but only if notes stay connected to their context.

---

### 5. Course Progress Dashboard

**What it does**: Displays a clear statistics overview:
- Total videos in course
- Videos completed
- Videos in progress
- Overall completion percentage

**Why it matters**: Visual progress creates motivation. Seeing "73% complete" encourages learners to push through and finish.

---

### 6. Video Search

**What it does**: Enables quick filtering of videos by name or title across the entire course.

**Why it matters**: Courses with 50+ videos need discoverability. Search lets users jump to specific topics without scrolling through modules.

---

### 7. Sorting Options

**What it does**: Allows sorting video lists by:
- Name (A-Z, Z-A)
- Date modified (oldest/newest first)

**Why it matters**: Different workflows require different orderings. Some learners follow sequential curriculum; others jump to recent content.

---

### 8. Portable Data

**What it does**: All progress, notes, and configuration stored in a `.coursewatcher` folder next to the video files (not in a central app database).

**Why it matters**: 
- Move courses between drives or computers — progress moves with them
- No vendor lock-in or cloud dependency
- Full user ownership of data

---

## User Stories

### First-Time Setup
> As a learner, I want to point CourseWatcher at any folder containing video files, and have it immediately start working — without configuration, sign-up, or setup wizard.

### Resume Watching
> As a learner, I want to close the app, reopen it days later, click a video, and have it resume exactly where I left off — automatically.

### Speed Control
> As a developer watching a tutorial, I want to increase playback speed to 1.75x for familiar content and slow down to 0.75x for complex code explanations.

### Quick Navigation
> As a learner, I want keyboard shortcuts to skip back 5 seconds when I miss something, or jump forward 30 seconds to skip an intro.

### Track Completion
> As a learner, I want to see which videos I've finished, which are in progress, and my overall course completion percentage — so I stay motivated.

### Take Notes
> As a student, I want to write Markdown notes for each video that get saved automatically and stay attached to that specific lesson.

### Search Lessons
> As a learner with a 100-video course, I want to search for "authentication" and immediately find all lessons about that topic.

---

## Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| **Performance** | Startup in under 3 seconds; video playback starts instantly |
| **Reliability** | Progress auto-save with no data loss on unexpected shutdown |
| **Portability** | Works on Windows, macOS, and Linux |
| **Privacy** | Zero external network calls; 100% local operation |
| **Installation** | Single command (`npx coursewatcher`) or standalone executable |
| **Dependencies** | Minimal — no required external software (database embedded) |

---

## Technology Strategy

| Decision | Rationale |
|----------|-----------|
| **CLI + Web UI** | CLI for simplicity; browser-based UI for rich video playback and responsive design |
| **Local SQLite** | Robust, zero-config database that travels with the course folder |
| **Server-Side Rendering** | No React/Vite build complexity — plain HTML/JS for maintainability |
| **Node.js Runtime** | Cross-platform, widely available, excellent for I/O operations |

---

## Distribution Options

1. **npm Package**: `npm install -g coursewatcher` — for developers with Node.js
2. **npx Temporary Run**: `npx coursewatcher` — zero install, try immediately
3. **Standalone Executable**: Single `.exe` file for Windows users without Node.js

---

## Roadmap Vision

### Phase 1: Core Product (Current)
- [x] Video scanning and module organization
- [x] Progress persistence and auto-resume
- [x] Web-based video player with keyboard shortcuts
- [x] Per-video notes
- [x] Course statistics dashboard
- [x] Search functionality

### Phase 2: Enhanced Experience
- [ ] Configurable keyboard shortcuts
- [ ] Dark/light theme toggle
- [ ] Video thumbnails
- [ ] Bookmarks within videos (mark important timestamps)
- [ ] Export/import progress data

### Phase 3: Advanced Features
- [ ] AI-powered video summarization (Google Gemini integration)
- [ ] Transcript generation and search
- [ ] Multi-course library view
- [ ] Mobile-responsive design for tablet usage

---

## Success Metrics

| Metric | Target |
|--------|--------|
| **Setup Time** | < 10 seconds from first run to watching video |
| **Progress Accuracy** | 100% reliable resume-from-position |
| **Platform Coverage** | Windows, macOS, Linux support |
| **User Adoption** | npm downloads, GitHub stars as growth indicators |

---

## Competitive Landscape

| Alternative | Limitation CourseWatcher Solves |
|-------------|--------------------------------|
| **VLC Media Player** | No course structure, no progress tracking across sessions |
| **Windows Media Player** | No keyboard shortcuts, no multi-video progress |
| **Plex/Jellyfin** | Over-engineered for courses; requires server setup |
| **Browser-based streaming** | Requires internet; doesn't work for downloaded courses |

---

## Summary

CourseWatcher exists because **downloading a course should mean owning your learning experience**. Generic media players fail learners by treating educational content like random video files. CourseWatcher fixes this by:

1. **Remembering where you left off** — always
2. **Organizing content** — like the course creator intended
3. **Providing power-user controls** — speed, seeking, shortcuts
4. **Enabling active learning** — with integrated notes
5. **Keeping everything portable** — data stays with your files

**The goal**: Make watching downloaded courses feel as seamless as watching on YouTube — but with full offline capability, privacy, and ownership.

---

*This document serves as the product vision and functional requirements for CourseWatcher. It should be used as a reference for development decisions, feature prioritization, and onboarding new contributors.*
