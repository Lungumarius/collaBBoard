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
- Fixed a silent failure on all mouse interactions (drawing/clicking) caused by the usage of the deprecated `canvas.getPointer` method which was removed in Fabric v6; replaced it entirely with `opt.scenePoint`.
- Solved an issue where the board would render with an invisible 0x0 dimension due to React's first-render cycle mismatch with CSS Flexbox loading by implementing a standard `ResizeObserver`.
- Updated template placement logic to use the modern `viewportTransform` property instead of the deprecated method.
- **Deep Compatibility Fix:** Fixed a silent crash when selecting the Pen tool by explicitly instantiating `fabric.PencilBrush`, which is no longer attached by default in Fabric v6.
- Fixed Next.js build compilation failure by correcting a stale dependency (`canvasContainerRef`) inside the `TextInputModal`'s `useEffect`.
- Wrapped canvas dimensions calculation in a slight delay (setTimeout) at boot-time to guarantee that Flexbox layout has fully painted the DOM sizes before assigning them to Fabric.
