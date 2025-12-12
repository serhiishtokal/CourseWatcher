# CourseWatcher Best Practices

> **A guide for maintaining clean, readable, and extensible code.**

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Naming Conventions](#naming-conventions)
3. [Code Style](#code-style)
4. [Node.js Best Practices](#nodejs-best-practices)
5. [EJS Templates](#ejs-templates)
6. [SQLite Database](#sqlite-database)
7. [CLI Development](#cli-development)
8. [Error Handling](#error-handling)
9. [Documentation](#documentation)
10. [Version Control](#version-control)

---

## Project Structure

### Recommended Directory Layout

```
coursewatcher/
├── bin/                    # CLI entry point (executable scripts)
│   └── coursewatcher.js    # Main CLI runner
├── src/                    # Application source code
│   ├── commands/           # CLI command handlers
│   ├── controllers/        # Request handlers for web routes
│   ├── models/             # Database models & queries
│   ├── services/           # Business logic layer
│   ├── utils/              # Shared utility functions
│   └── server.js           # Express server setup
├── views/                  # EJS templates
│   ├── layouts/            # Base layout templates
│   ├── partials/           # Reusable components (header, footer, etc.)
│   └── pages/              # Page-specific templates
├── public/                 # Static assets
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side JavaScript
│   └── images/             # Image assets
├── docs/                   # Documentation
├── tests/                  # Test files
├── .coursewatcher/         # User data (auto-generated, gitignored)
├── package.json
└── README.md
```

### Key Principles

| Principle | Description |
|-----------|-------------|
| **Separation of Concerns** | Each folder has a single, clear purpose |
| **Flat When Possible** | Avoid deep nesting; max 3-4 levels |
| **Colocation** | Keep related files together (e.g., test next to source) |

---

## Naming Conventions

### Files & Directories

| Type | Convention | Example |
|------|------------|---------|
| **Files** | `kebab-case` | `video-player.js`, `course-service.js` |
| **Directories** | `kebab-case` | `src/commands/`, `views/partials/` |
| **EJS Templates** | `kebab-case.ejs` | `video-card.ejs`, `module-list.ejs` |
| **CSS Files** | `kebab-case.css` | `video-player.css` |

### Code

| Type | Convention | Example |
|------|------------|---------|
| **Variables** | `camelCase` | `videoProgress`, `currentModule` |
| **Functions** | `camelCase` | `getVideoById()`, `updateProgress()` |
| **Classes** | `PascalCase` | `VideoService`, `DatabaseManager` |
| **Constants** | `UPPER_SNAKE_CASE` | `DEFAULT_PORT`, `MAX_RETRIES` |
| **Private members** | Prefix with `_` | `_connection`, `_validateInput()` |

---

## Code Style

### General Guidelines

```javascript
// ✅ Good: Clear, self-documenting code
async function findVideoById(id) {
  const video = await db.get('SELECT * FROM videos WHERE id = ?', [id]);
  
  if (!video) {
    throw new NotFoundError(`Video not found: ${id}`);
  }
  
  return video;
}

// ❌ Bad: Cryptic names, no error handling
async function get(i) {
  return await db.get('SELECT * FROM videos WHERE id = ' + i);
}
```

### Formatting Rules

| Rule | Standard |
|------|----------|
| **Indentation** | 2 spaces |
| **Quotes** | Single quotes for strings |
| **Semicolons** | Always use semicolons |
| **Line Length** | Max 100 characters |
| **Trailing Commas** | Use in multiline arrays/objects |
| **Blank Lines** | One between logical sections |

### Comments

```javascript
// ✅ Good: Explain WHY, not WHAT
// Videos marked as completed need 90% watch time to prevent 
// accidental completion from seeking to the end
const COMPLETION_THRESHOLD = 0.9;

// ❌ Bad: Obvious comment that adds nothing
// Set the port to 3000
const port = 3000;
```

---

## Node.js Best Practices

### Async/Await

```javascript
// ✅ Good: Clean async/await with proper error handling
async function initializeDatabase() {
  try {
    await db.run('CREATE TABLE IF NOT EXISTS videos (...)');
    await db.run('CREATE TABLE IF NOT EXISTS notes (...)');
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// ❌ Bad: Callback hell
function initializeDatabase(callback) {
  db.run('CREATE TABLE...', (err) => {
    if (err) return callback(err);
    db.run('CREATE TABLE...', (err) => {
      if (err) return callback(err);
      callback(null);
    });
  });
}
```

### Module Organization

```javascript
// ✅ Good: Clear imports, exports at the end
const path = require('path');
const express = require('express');

const { VideoService } = require('./services/video-service');
const { DatabaseManager } = require('./models/database');

class CourseController {
  // Implementation...
}

module.exports = { CourseController };
```

### Environment Variables

```javascript
// ✅ Good: Centralized config with defaults
// config.js
module.exports = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || '.coursewatcher/database.sqlite',
  logLevel: process.env.LOG_LEVEL || 'info',
};
```

### Dependency Injection

```javascript
// ✅ Good: Testable, loosely coupled
class VideoService {
  constructor(database) {
    this._db = database;
  }
  
  async getVideo(id) {
    return this._db.get('SELECT * FROM videos WHERE id = ?', [id]);
  }
}

// Usage
const db = new Database();
const videoService = new VideoService(db);

// Testing (easy to mock)
const mockDb = { get: jest.fn() };
const testService = new VideoService(mockDb);
```

---

## EJS Templates

### Template Organization

```
views/
├── layouts/
│   └── main.ejs           # Base HTML structure
├── partials/
│   ├── head.ejs           # <head> content
│   ├── header.ejs         # Navigation bar
│   ├── footer.ejs         # Footer content
│   ├── video-card.ejs     # Reusable video card
│   └── module-item.ejs    # Module list item
└── pages/
    ├── index.ejs          # Home page
    ├── player.ejs         # Video player page
    └── settings.ejs       # Settings page
```

### Using Partials

```html
<!-- ✅ Good: Decomposed into reusable partials -->
<!DOCTYPE html>
<html>
  <%- include('../partials/head', { title: pageTitle }) %>
  <body>
    <%- include('../partials/header') %>
    
    <main>
      <% videos.forEach(video => { %>
        <%- include('../partials/video-card', { video }) %>
      <% }) %>
    </main>
    
    <%- include('../partials/footer') %>
  </body>
</html>
```

### Keep Logic Minimal

```html
<!-- ✅ Good: Simple display logic only -->
<div class="video-status">
  <% if (video.status === 'completed') { %>
    <span class="badge badge-success">✓ Completed</span>
  <% } else if (video.status === 'in-progress') { %>
    <span class="badge badge-warning">In Progress</span>
  <% } else { %>
    <span class="badge badge-default">Not Started</span>
  <% } %>
</div>

<!-- ❌ Bad: Complex business logic in template -->
<div>
  <%= videos.filter(v => v.watched).sort((a,b) => b.date - a.date).slice(0,5).map(v => v.name).join(', ') %>
</div>
```

### Security: Escaping Output

```html
<!-- ✅ Safe: Escaped output for user data -->
<h1><%= video.title %></h1>

<!-- ⚠️ Unescaped: Only for trusted HTML (like Markdown-rendered content) -->
<div class="notes"><%- renderedMarkdown %></div>

<!-- ❌ Dangerous: Never do this with user input! -->
<div><%- userProvidedContent %></div>
```

---

## SQLite Database

### Schema Design

```sql
-- ✅ Good: Clear schema with constraints
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('unwatched', 'in-progress', 'completed')) DEFAULT 'unwatched',
  module_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id)
);

CREATE INDEX idx_videos_module ON videos(module_id);
CREATE INDEX idx_videos_status ON videos(status);
```

### Parameterized Queries

```javascript
// ✅ Good: Parameterized query (SQL injection safe)
async function findVideoByPath(videoPath) {
  return db.get(
    'SELECT * FROM videos WHERE path = ?',
    [videoPath]
  );
}

// ✅ Good: Named parameters for complex queries
async function updateProgress(videoId, position, status) {
  return db.run(
    `UPDATE videos 
     SET position = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [position, status, videoId]
  );
}

// ❌ Bad: String concatenation (SQL injection vulnerable!)
async function findVideo(path) {
  return db.get('SELECT * FROM videos WHERE path = "' + path + '"');
}
```

### Transactions for Bulk Operations

```javascript
// ✅ Good: Wrap bulk operations in transactions
async function scanAndImportVideos(videoPaths) {
  await db.run('BEGIN TRANSACTION');
  
  try {
    for (const videoPath of videoPaths) {
      await db.run(
        'INSERT OR IGNORE INTO videos (path, title) VALUES (?, ?)',
        [videoPath, path.basename(videoPath)]
      );
    }
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
```

### Database Connection

```javascript
// ✅ Good: Single connection, reused throughout app lifetime
class Database {
  constructor(dbPath) {
    this._dbPath = dbPath;
    this._db = null;
  }
  
  async connect() {
    if (this._db) return this._db;
    
    this._db = await open({
      filename: this._dbPath,
      driver: sqlite3.Database,
    });
    
    // Enable foreign keys
    await this._db.run('PRAGMA foreign_keys = ON');
    
    return this._db;
  }
  
  async close() {
    if (this._db) {
      await this._db.close();
      this._db = null;
    }
  }
}
```

---

## CLI Development

### Entry Point Structure

```javascript
#!/usr/bin/env node

// bin/coursewatcher.js
const { program } = require('commander');
const { version } = require('../package.json');

program
  .name('coursewatcher')
  .description('Track your progress in video courses')
  .version(version);

program
  .argument('[path]', 'path to course directory', '.')
  .option('-p, --port <number>', 'server port', '3000')
  .option('--no-browser', 'do not open browser automatically')
  .action(async (coursePath, options) => {
    // Handle command
  });

program.parse();
```

### User Feedback

```javascript
// ✅ Good: Clear, helpful output
const chalk = require('chalk');

function log(message) {
  console.log(chalk.blue('ℹ'), message);
}

function success(message) {
  console.log(chalk.green('✓'), message);
}

function error(message) {
  console.error(chalk.red('✗'), message);
}

function warn(message) {
  console.warn(chalk.yellow('⚠'), message);
}

// Usage
log('Scanning for video files...');
success(`Found ${count} videos in ${modules} modules`);
log(`Server running at ${chalk.cyan(`http://localhost:${port}`)}`);
```

### Graceful Exit

```javascript
// ✅ Good: Handle termination signals
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await server.close();
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.close();
  await database.close();
  process.exit(0);
});
```

---

## Error Handling

### Custom Error Classes

```javascript
// errors.js
class CourseWatcherError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CourseWatcherError';
  }
}

class NotFoundError extends CourseWatcherError {
  constructor(resource) {
    super(`Not found: ${resource}`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ValidationError extends CourseWatcherError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

module.exports = { CourseWatcherError, NotFoundError, ValidationError };
```

### Express Error Middleware

```javascript
// ✅ Good: Centralized error handling
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log errors in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  
  res.status(statusCode).render('error', { 
    message, 
    statusCode,
  });
});
```

---

## Documentation

### File Headers

```javascript
/**
 * Video Service
 * 
 * Handles all video-related business logic including:
 * - Video discovery and scanning
 * - Progress tracking
 * - Watch status management
 * 
 * @module services/video-service
 */
```

### Function Documentation

```javascript
/**
 * Updates the playback position for a video.
 * 
 * @param {number} videoId - The unique video identifier
 * @param {number} position - Current position in seconds
 * @returns {Promise<void>}
 * @throws {NotFoundError} If video doesn't exist
 * 
 * @example
 * await videoService.updatePosition(123, 450);
 */
async updatePosition(videoId, position) {
  // Implementation
}
```

### README Structure

Every significant module should have a small README or header comment explaining:

1. **Purpose** — What does this module do?
2. **Dependencies** — What does it require?
3. **Usage** — How do you use it?
4. **Examples** — Show common use cases

---

## Version Control

### Commit Messages

```
<type>: <short summary>

<optional body>

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation changes
- style:    Formatting, no code change
- refactor: Code restructuring
- test:     Adding tests
- chore:    Maintenance tasks
```

**Examples:**

```
feat: add keyboard shortcuts for playback speed

fix: prevent crash when video file is missing

docs: add SQLite best practices to docs

refactor: extract video scanning to separate service
```

### Branch Naming

```
feature/video-search
fix/progress-not-saving
docs/update-readme
refactor/database-layer
```

### .gitignore Essentials

```gitignore
# Dependencies
node_modules/

# User data (portable with videos, not with repo)
.coursewatcher/

# Environment
.env
.env.local

# Build output
dist/

# IDE
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

---

## Quick Reference Card

| Area | Do ✅ | Don't ❌ |
|------|-------|---------|
| **Files** | `kebab-case.js` | `camelCase.js`, `PascalCase.js` |
| **Variables** | `camelCase` | `snake_case`, `UPPERCASE` |
| **Classes** | `PascalCase` | `camelCase` |
| **Constants** | `UPPER_SNAKE_CASE` | `camelCase` |
| **Queries** | Parameterized `?` | String concatenation |
| **Templates** | `<%= escaped %>` | `<%- unescaped %>` for user data |
| **Async** | `async/await` | Callbacks where avoidable |
| **Errors** | Custom error classes | Generic `throw new Error()` |
| **Comments** | Explain *why* | Explain *what* |

---

*Last updated: December 2024*
