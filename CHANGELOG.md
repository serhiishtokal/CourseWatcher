# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-01-11
### Added
- **Video Queue Panel**: A new sidebar to view and navigate videos in the current module.
- **Autoplay**: Automatically plays the next video with a countdown overlay.
- **Dynamic Port Selection**: Server automatically finds an available port if the default is busy.

### Changed
- Improved queue UI styling and width.
- specific port can still be forced with `--port`.

## [1.2.0] - 2026-01-11
### Added
- Integrated Plyr video player for a modern, YouTube-like experience.
- Added clear CLI options documentation in README.

### Changed
- Moved video title to the top of the player for better visibility.

## [1.0.1] - 2026-01-11
### Fixed
- Fixed "Forced shutdown after timeout" issue by properly closing active browser connections (Keep-Alive sockets) on server shutdown.

## [1.0.0] - 2026-01-11
### Added
- Initial release of CourseWatcher CLI and web interface.
- Video tracking and progress saving.
- Video grouping by folder structure.
- Smart player with keyboard shortcuts.
- Markdown notes for each video.
- Portable data storage in `.coursewatcher`.
