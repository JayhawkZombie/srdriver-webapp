# Impulse Response System Overview

## Architecture Diagram

```
+-------------------+         +---------------------+         +---------------------+
|                   | emits   |                     |subscribes|                     |
|  Impulse Source   +-------->+  ImpulseEventContext+-------->+  Any Subscriber     |
| (e.g. AudioChunker|         |  (pub/sub context)  |         |  (via useImpulseEvents)|
|   Demo, UI, etc.) |         |                     |         |                     |
+-------------------+         +---------------------+         +---------------------+
                                                                      |
                                                                      v
                                                          +--------------------------------------+
                                                          |  useImpulseResponseHandlerToCommand  |
                                                          |  (main device action logic)          |
                                                          +--------------------------------------+
                                                                        |
                                                                        v
                                                          +-----------------------------+
                                                          |  Device Controller          |
                                                          |  (sends command to device)  |
                                                          +-----------------------------+

Other components (e.g. DeviceSidebar) <---+
  - Can also subscribe to impulses using useImpulseEvents()
  - Can run any custom logic on impulse events
```

## How It Works

- **ImpulseEventContext** is the event bus for impulses.
- **useImpulseEvents** gives you access to `emit` (to send an impulse) and `subscribe` (to listen for impulses).
- **useImpulseResponseHandlerToCommand** is a hook that subscribes to impulses and sends a command to the device (using app state for action/args).
- **Any component** can also subscribe to impulses for custom logic.

## Example Usage

### Main Handler (in App.tsx)
```tsx
import { useImpulseResponseHandlerToCommand } from './hooks/useImpulseResponseHandlerToCommand';

function App() {
  useImpulseResponseHandlerToCommand();
  // ...rest of your app
}
```

### Custom Subscriber (anywhere)
```tsx
import { useImpulseEvents } from '../context/ImpulseEventContext';

function MyComponent() {
  const { subscribe } = useImpulseEvents();
  useEffect(() => {
    const unsubscribe = subscribe((impulse) => {
      // Do something with impulse info!
    });
    return unsubscribe;
  }, [subscribe]);
}
```

---

## Summary Table

| Name                    | What is it?         | What does it do?                        | Where to use it?                |
|-------------------------|---------------------|------------------------------------------|---------------------------------|
| ImpulseEventContext     | Context Provider    | Event bus for impulses                   | App root (already in place)     |
| useImpulseEvents        | Hook                | Access to emit/subscribe for impulses    | Any component                   |
| useImpulseResponseHandlerToCommand | Custom Hook       | Subscribes to impulses, sends device cmd | App.tsx or top-level component  |

--- 