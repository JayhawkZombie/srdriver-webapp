# Timeline Context Menu Architecture (2024 Refactor)

## Goals
- **Single, unified entry point** for all context menus (background, rects, etc.) in the timeline.
- **No event shape confusion**: event handling is done at the lowest level (Konva node), and only clean info/position is passed up.
- **Dashboard only supplies business logic** (the actions array and what to do when an action is clicked), not event plumbing.
- **Easy to extend** for new context types (tracks, markers, etc.).
- **No pointer handler indirection for context menus.**

---

## Key Concepts

### 1. **TimelineVisuals Owns All Event Handling**
- All right-clicks (background, rect, etc.) are handled in `TimelineVisuals`.
- `TimelineVisuals` knows what was clicked and can build a context info object.

### 2. **Single Context Menu Entry Point**
- `TimelineVisuals` exposes a single prop:
  ```ts
  onRequestContextMenu: (params: {
    position: { x: number; y: number };
    info: TimelineContextInfo; // union: rect, background, etc.
  }) => void;
  ```
- When a right-click happens, `TimelineVisuals` calls this prop with:
  - The click position
  - The context info (rect, background, etc.)

### 3. **Dashboard Supplies Only the Actions Logic**
- The dashboard provides a `getActions` function (or similar) that takes the context info and returns the actions array.
- The dashboard manages the open/close state of the context menu, but not the event plumbing.

### 4. **TimelineContextMenu is Stateless**
- It just takes `isOpen`, `position`, `info`, and `actions`.
- You **do not need to delete TimelineContextMenu.tsx**—it can be kept as a presentational component.

---

## Types

```ts
type TimelineContextInfo =
  | { type: 'background'; time: number; trackIndex: number }
  | { type: 'rect'; rect: TimelineResponse };

interface TimelineMenuAction {
  key: string;
  text: string;
  icon?: string;
  onClick?: (info: TimelineContextInfo) => void;
  disabled?: boolean;
  hidden?: boolean;
  submenu?: TimelineMenuAction[];
}
```

---

## Example Usage

```tsx
// In TimelineVisuals.tsx
const handleContextMenu = (info: TimelineContextInfo, evt: Konva.KonvaEventObject<PointerEvent>) => {
  evt.evt.preventDefault();
  onRequestContextMenu({
    position: { x: evt.evt.clientX, y: evt.evt.clientY },
    info,
  });
};

// Attach handleContextMenu to both background and rects

// In Dashboard:
const getActions = (info: TimelineContextInfo) => {
  if (info.type === 'rect') {
    return [
      { key: 'edit', text: 'Edit', onClick: ... },
      { key: 'delete', text: 'Delete', onClick: ... },
      // etc.
    ];
  } else {
    return [
      { key: 'add', text: 'Add Event', onClick: ... },
      // etc.
    ];
  }
};

<TimelineVisuals
  onRequestContextMenu={({ position, info }) => {
    setContextMenuOpen(true);
    setContextMenuPosition(position);
    setContextMenuInfo(info);
    setContextMenuActions(getActions(info));
  }}
  // ...other props
/>
<TimelineContextMenu
  isOpen={contextMenuOpen}
  position={contextMenuPosition}
  info={contextMenuInfo}
  actions={contextMenuActions}
/>
```

---

## Summary
- **All event handling stays in TimelineVisuals.**
- **Dashboard only provides the actions logic and manages open/close state.**
- **No pointer handler indirection for context menus.**
- **All context menus (rect, background, etc.) go through the same code path.**
