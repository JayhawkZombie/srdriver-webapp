# Impulse Event Flow

```plaintext
Impulse Source (e.g. AudioChunkerDemo, UI, etc.)
        |
        v
ImpulseEventContext (pub/sub)
        |
        v
Any Descendant (via useImpulseEvents)
        |
        v
Custom Response Logic (fire pattern, send command, update state, etc.)
```

- UI cards only update app state.
- All device logic is handled in a centralized handler.
- Any component can subscribe to impulses and respond however it wants.