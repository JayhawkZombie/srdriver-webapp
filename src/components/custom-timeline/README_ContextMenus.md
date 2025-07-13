# Timeline Context Menu: Dead Simple, Plugin-Friendly API

## Goals
- **One entry point** for all context menus (background, rects, etc.)
- **No event confusion**: Timeline handles all event plumbing and info gathering
- **Dashboard just supplies an array of actions** (or a function)
- **Submenus and plugins are easy**
- **Declarative, obvious, and easy to extend**

---

## Types

```ts
type TimelineContextInfo =
  | { type: 'background'; time: number; trackIndex: number }
  | { type: 'rect'; rect: TimelineResponse };

type TimelineMenuAction = {
  key: string;
  text?: string;
  icon?: string;
  onClick?: (info: TimelineContextInfo) => void;
  disabled?: boolean;
  hidden?: boolean;
  submenu?: TimelineMenuAction[];
  divider?: boolean;
};
```

---

## Usage: Dashboard Defines Actions

```tsx
const mixer = new Mixer();

const actions: TimelineMenuAction[] = [
  {
    key: 'add',
    text: 'Add Random Response',
    icon: 'add',
    onClick: () => { /* ... */ },
  },
  {
    key: 'mixer',
    text: 'Mixer Actions',
    icon: 'settings',
    submenu: [
      {
        key: 'fire-led',
        text: 'Fire LED Pattern 1',
        onClick: (info) => {
          mixer.triggerResponse({ type: 'led', patternId: 1, ...info });
        },
      },
      // ...more mixer actions
    ],
  },
  {
    key: 'log',
    text: 'Log Info',
    icon: 'console',
    onClick: (info) => {
      console.log('Context menu info:', info);
    },
  },
  {
    key: 'close',
    text: 'Close',
    icon: 'cross',
    onClick: () => {},
  },
];

<TimelineVisuals
  actions={actions}
  // ...other props
/>
```

---

## Submenus & Plugins

- **Submenus:** Just use `submenu: [...]` in any action.
- **Plugins:** Compose actions from multiple sources.

```ts
function getPluginActions(info: TimelineContextInfo): TimelineMenuAction[] {
  return [
    {
      key: 'plugin-action',
      text: 'Plugin Action',
      onClick: (info) => { /* ... */ },
    },
  ];
}

const allActions = (info: TimelineContextInfo) => [
  ...actions,
  ...getPluginActions(info),
];

<TimelineVisuals actions={allActions} />
```

---

## TimelineVisuals: Handles All Event Plumbing

- Handles all right-clicks (background, rect, etc.)
- Figures out the context info
- Calls the actions array (or function) to get the menu items
- Shows the menu at the cursor
- Passes the context info to the chosen action’s `onClick`

```tsx
const [menuOpen, setMenuOpen] = useState(false);
const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
const [menuInfo, setMenuInfo] = useState<TimelineContextInfo | null>(null);
const [menuActions, setMenuActions] = useState<TimelineMenuAction[]>([]);

const handleContextMenu = (info: TimelineContextInfo, evt: Konva.KonvaEventObject<PointerEvent>) => {
  evt.evt.preventDefault();
  setMenuOpen(true);
  setMenuPosition({ x: evt.evt.clientX, y: evt.evt.clientY });
  setMenuInfo(info);
  setMenuActions(typeof actions === 'function' ? actions(info) : actions);
};

// Attach handleContextMenu to both background and rects

<TimelineContextMenu
  isOpen={menuOpen}
  position={menuPosition}
  info={menuInfo}
  actions={menuActions}
  onClose={() => setMenuOpen(false)}
/>
```

---

## Summary
- **All event handling and info gathering is inside TimelineVisuals.**
- **Dashboard just supplies the actions array (or function).**
- **Plugins can easily add actions.**
- **No more event confusion, no more duplicated code paths.**
- **Declarative, obvious, and easy to extend.**

