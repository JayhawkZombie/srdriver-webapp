# Refactor & Improvement Roadmap

A living checklist and roadmap for making the codebase more maintainable, scalable, and developer-friendly. Check off items as you complete them, and break down each into subtasks as needed!

---

## 🗂️ Architecture & Structure
- [ ] **Group files by feature/domain**
  - Move related files (impulse, device, audio, etc.) into feature folders for easier navigation and scaling.
  - _Subtasks:_
    - [ ] Create `impulse/`, `device/`, `audio/` folders
    - [ ] Move context, hooks, and types into appropriate folders

- [ ] **Centralize and export shared types**
  - Define and export types/interfaces (e.g., `ImpulseEvent`, `Device`) from a central `types/` folder.
  - _Subtasks:_
    - [ ] Create `types/` folder
    - [ ] Refactor imports to use centralized types

---

## ⚡️ Impulse System & Device Actions
- [ ] **Command/action registry**
  - Create a registry/map of available device actions for extensibility and dynamic UI.
  - _Subtasks:_
    - [ ] Implement `commandRegistry.ts`
    - [ ] Refactor impulse response handler to use registry
    - [ ] Add validation for args

- [ ] **UI for impulse response config**
  - Add a panel for users to select the impulse response action and arguments, with validation and live preview (stretch goal lol, maybe semi-live).
  - _Subtasks:_
    - [ ] Design config panel UI
    - [ ] Implement action/arg selection
    - [ ] Add live preview/test button

- [ ] **Expose debounce/throttle settings in UI**
  - Let users tune responsiveness and avoid device overload.
  - _Subtasks:_
    - [ ] Add debounce/throttle controls to settings
    - [ ] Wire up to impulse emission/response

---

## 🛠️ Developer Experience & Tooling
- [ ] **Event log panel/debug overlay**
  - Show all emitted impulses and responses in real time for debugging and tuning.
  - _Subtasks:_
    - [ ] Implement event log overlay
    - [ ] Add toggle to show/hide

- [ ] **Storybook stories for UI components**
  - Add Storybook for isolated UI development and testing.
  - _Subtasks:_
    - [ ] Set up Storybook
    - [ ] Add stories for key components

- [ ] **Add more visual READMEs and code comments**
  - Keep documentation up to date, especially for event-driven flows.
  - _Subtasks:_
    - [ ] Add diagrams to key folders
    - [ ] Document new patterns as they emerge

---

## 🚀 Performance & Testability
- [ ] **Performance tuning for impulse system**
  - Profile and optimize impulse emission/response for low latency.
  - _Subtasks:_
    - [ ] Benchmark current system
    - [ ] Tune debounce/throttle
    - [ ] Optimize event bus if needed

- [ ] **Add more tests (unit/integration)**
  - Ensure reliability and catch regressions early.
  - _Subtasks:_
    - [ ] Add tests for impulse logic
    - [ ] Add tests for device actions

---

## 🗺️ Roadmap Tools & Ideas
- [ ] **Tooling for roadmap management**
  - Integrate with project management tools or build a custom dashboard for tracking progress.
  - _Subtasks:_
    - [ ] Research integrations (GitHub Projects, Notion, etc.)
    - [ ] Prototype custom dashboard if needed

---

## 🎼 Timeline/Track Tools and UI
- [ ] **Timeline/track editor**
  - Implement a timeline UI for laying down tracks (e.g., background audio, effects).
  - _Subtasks:_
    - [ ] Design timeline/track editor component
    - [ ] Integrate with wave player for background track
- [ ] **Interactive impulse effect placement**
  - Allow users to shift-click on impulses in the graph to add effect instances.
  - _Subtasks:_
    - [ ] Implement shift-click detection on graph
    - [ ] UI for adding/editing/removing effect instances
    - [ ] Sync effect instances with timeline

---

## 🛣️ Next Steps: Timeline Rect Editing & Pro Editor Features (Planned)

### 1. Robust Response Rect Editing
- [ ] **Rect Creation**: Click or drag to create a new response rect on a track (snap to grid/time if desired).
- [ ] **Drag-and-Drop**: Drag rects horizontally (move in time) and vertically (move between tracks), with visual feedback.
- [ ] **Resize Handles**: Add handles to both ends of each rect for resizing (mouse/touch drag, snap to grid/time).
- [ ] **Selection & Multi-Selection**: Click to select, Shift/Ctrl-click for multi-select, with clear visual feedback.

### 2. Keyboard Shortcuts (BlueprintJS Hotkeys)
- [ ] Integrate BlueprintJS HotkeysProvider at the app/story level.
- [ ] Add hotkeys for:
    - Delete selected rect(s)
    - Duplicate rect(s)
    - Nudge left/right (arrow keys)
    - Select all (Cmd/Ctrl+A)
    - Deselect (Esc)
    - (Optional) Play/pause, jump to next/prev rect, etc.

### 3. State Management & Undo/Redo (Optional, but powerful)
- [ ] Centralize rect state in Zustand or a dedicated context.
- [ ] Add undo/redo stack for rect edits (simple array or library).
- [ ] Expose actions for all rect operations (create, move, resize, delete, etc.)

### 4. Visual Polish & UX
- [ ] Add hover/drag/resize feedback (shadows, outlines, color changes).
- [ ] Show time labels on rects (start/end).
- [ ] (Optional) Add tooltips or context menus for rect actions.

### 5. Prepare for LED/Playback Logic
- [ ] Ensure rects have all needed metadata (start, end, track, type, etc.).
- [ ] Add a simple effect or callback when playhead enters/exits a rect (for future LED logic).

---

**This is the foundation for a pro-level timeline editor!**
- Once these are in place, adding planned light show/LED logic will be easy and fun.
- Prioritize robust editing and hotkey UX first, then polish and extend.

_Add new ideas below as they come up!_ 