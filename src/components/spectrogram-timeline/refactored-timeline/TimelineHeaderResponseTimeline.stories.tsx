import React from "react";
import TimelineHeader from "./TimelineHeader";
import ResponseTimeline from "./ResponseTimeline";
import { PlaybackProvider } from "./PlaybackContext";
import { FakeAppStateStoryProvider } from "../../../store/FakeAppStateStoryProvider";
import { usePlaybackAutoAdvance } from "../../../hooks/usePlaybackAutoAdvance";
import { DeviceControllerProvider } from "../../../controllers/DeviceControllerContext";
import { FakeDeviceControllerProvider } from "../../../stories/FakeDeviceControllerProvider";
import { Mixer } from '../../../controllers/Mixer';
import type { TimelineMenuAction } from "./TimelineContextMenu";

export default {
    title: "RefactoredTimeline/TimelineHeader + ResponseTimeline",
};

export const WithFakeAudioData = () => {
    return (
        <FakeDeviceControllerProvider>  
                <FakeAppStateStoryProvider mockType="screenshotBar">
                    <PlaybackProvider totalDuration={15}>
                        <PlaybackAutoAdvanceEnabler />
                        <div
                            style={{
                                width: "100%",
                                maxWidth: 900,
                                margin: "0 auto",
                                background: "#181818",
                                padding: 24,
                                minHeight: 320,
                            }}
                        >
                            <TimelineHeader />
                            <div style={{ height: 24 }} />
                            <ResponseTimeline />
                        </div>
                    </PlaybackProvider>
                </FakeAppStateStoryProvider>
        </FakeDeviceControllerProvider>
    );
};

// Minimal type for context menu info
interface ContextMenuInfo {
  responseId?: string;
  [key: string]: unknown;
}

// Mock LedEngine for Storybook/demo
class MockLedEngine {
  firePattern(patternId: number, args: Record<string, unknown>) {
    // eslint-disable-next-line no-console
    console.log(`[MockLedEngine] firePattern called: patternId=`, patternId, 'args=', args);
  }
}

export const UnifiedDemo = () => {
  const [responses, setResponses] = React.useState<any[]>([]);
  const mixer = React.useMemo(() => new Mixer(new MockLedEngine()), []);
  // Premade response data for pattern 17
  const premadePattern17 = {
    patternId: 17,
    color: '#ff0',
    customArg: 'demo',
  };
  const actions: TimelineMenuAction[] = [
    {
      key: 'actions',
      text: 'Actions',
      submenu: [
        {
          key: 'fire-pattern',
          text: 'Fire Pattern 17',
          icon: 'flash',
          onClick: (info: any) => {
            console.log('info.data:', info.data);
            if (info.data && info.data.patternId) {
              mixer.triggerResponse({ ...info, type: 'led', patternId: info.data.patternId, args: info.data });
            } else {
              console.warn('No patternId in info.data');
            }
          },
        },
        {
          key: 'add',
          text: 'Add Pattern 17 Response',
          icon: 'add',
          onClick: () => {
            // Add a fake response rect with premade data
            setResponses(prev => [
              ...prev,
              {
                id: crypto.randomUUID(),
                timestamp: Math.random() * 10,
                duration: 1,
                trackIndex: 0,
                data: premadePattern17,
                triggered: false,
              },
            ]);
          },
        },
        {
          key: 'delete',
          text: 'Delete Response',
          icon: 'trash',
          onClick: (info: ContextMenuInfo) => {
            // Add your deleteResponse logic here
          },
        },
        {
          key: 'log',
          text: 'Log Info',
          icon: 'console',
          onClick: (info: ContextMenuInfo) => {
            // eslint-disable-next-line no-console
            console.log('Context menu info:', info);
          },
        },
        {
          key: 'close',
          text: 'Close',
          icon: 'cross',
          onClick: () => {},
        },
      ],
    },
  ];
  return (
    <FakeDeviceControllerProvider>
      <FakeAppStateStoryProvider 
        initialState={{
          timeline: {
            responses: responses,
          },
        }}
        mockType="screenshotBar"
      >
        <PlaybackProvider totalDuration={15}>
          <PlaybackAutoAdvanceEnabler />
          <div
            style={{
              width: "100%",
              maxWidth: 900,
              margin: "0 auto",
              background: "#181818",
              padding: 24,
              minHeight: 320,
            }}
          >
            <TimelineHeader />
            <ResponseTimeline actions={actions} />
          </div>
        </PlaybackProvider>
      </FakeAppStateStoryProvider>
    </FakeDeviceControllerProvider>
  );
};

function PlaybackAutoAdvanceEnabler() {
    usePlaybackAutoAdvance(true);
    return null;
}
