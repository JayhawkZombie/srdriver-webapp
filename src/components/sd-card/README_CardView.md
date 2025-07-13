# SD Card View UI State Machine

```mermaid
stateDiagram-v2
    [*] --> NoDevice
    NoDevice: No device selected or no SD card support
    NoDevice --> Idle: Device with SD card selected
    Idle: Ready to load
    Idle --> Loading: User clicks 'Load SD Card'
    Loading: Waiting for chunked LIST response
    Loading --> Loaded: All chunks received, file tree parsed
    Loading --> Error: Error during loading
    Loaded: File tree displayed
    Loaded --> Idle: User requests reload
    Error: Error state
    Error --> Idle: User retries
    Idle --> NoDevice: Device disconnected or SD card removed
    Loading --> NoDevice: Device disconnected
    Loaded --> NoDevice: Device disconnected
    Error --> NoDevice: Device disconnected
```

## State Descriptions
- **NoDevice**: No device is selected, or the selected device does not support SD card operations. UI shows a message.
- **Idle**: Device is ready, but the SD card file tree is not loaded. UI shows a 'Load SD Card' button.
- **Loading**: The LIST command has been sent and the app is waiting for chunked BLE responses. UI shows a loading spinner/progress.
- **Loaded**: The file tree has been successfully loaded and is displayed in the UI.
- **Error**: An error occurred during loading or BLE communication. UI shows an error message and a retry option.

## Transitions
- User actions (button clicks) and device connection/disconnection events cause transitions between states.
- The UI should always reflect the current state explicitly.
