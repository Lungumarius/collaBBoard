# Changelog

All notable changes to this project during our sessions will be documented in this file.

## [Unreleased]
### Added
- Created `GEMINI.md` with project architecture and coding guidelines based on project codebase analysis.
- Established this `CHANGELOG.md` file to keep track of development progress across sessions.

### Fixed
- Re-injected the accidentally removed primary `useEffect` in `WhiteboardCanvas.tsx` which initializes `fabric.Canvas` and connects the application to WebSocket events, thus restoring core drawing and template functionalities.
- Resolved a React 19 linter warning in `WhiteboardCanvas.tsx` and an unnecessary state-sync within the `TextInputModal` component.
- Separated the `fabric.Canvas` initialization from the WebSocket connection logic into distinct `useEffect` hooks in `WhiteboardCanvas.tsx`. This prevents the canvas instance from being silently detached and destroyed by React's re-renders when local component states (like the user token) change.
