import React from "react";
import ResponseTimeline from "./ResponseTimeline";
import { PlaybackProvider, usePlayback } from "./PlaybackContext";
import { usePlaybackAutoAdvance } from "../../../hooks/usePlaybackAutoAdvance";
import type { TimelineMenuAction } from "./TimelineContextMenu";
import { useDeleteTimelineResponse, useAddTimelineResponse } from '../../../store/appStore';
import { FakeDeviceControllerProvider } from '../../../stories/FakeDeviceControllerProvider';
import { Mixer } from '../../../controllers/Mixer';

// Minimal type for context menu info
interface ContextMenuInfo {
  responseId?: string;
  [key: string]: unknown;
}

function PlaybackAutoAdvanceEnabler() {
  usePlaybackAutoAdvance(true);
  return null;
}

function PlaybackAutoStart() {
  const { play, isPlaying } = usePlayback();
  React.useEffect(() => {
    if (!isPlaying) play();
  }, [isPlaying, play]);
  return null;
}

// Mock LedEngine for Storybook/demo
class MockLedEngine {
  firePattern(patternId: number, args: any) {
    // eslint-disable-next-line no-console
    console.log(`[MockLedEngine] firePattern called: patternId=`, patternId, 'args=', args);
  }
}

export default {
  title: "RefactoredTimeline/ResponseTimeline",
  component: ResponseTimeline,
};

export const Basic = () => {
  const deleteResponse = useDeleteTimelineResponse();
  const addResponse = useAddTimelineResponse();
  const actions: TimelineMenuAction[] = [
    {
      key: 'add',
      text: 'Add Random Response',
      icon: 'add',
      onClick: () => {
        const timestamp = Math.random() * 10;
        const duration = 0.5 + Math.random() * 2;
        const trackIndex = Math.floor(Math.random() * 3);
        addResponse({
          id: crypto.randomUUID(),
          timestamp,
          duration,
          trackIndex,
          data: {},
          triggered: false,
        });
      },
    },
    {
      key: 'delete',
      text: 'Delete Response',
      icon: 'trash',
      onClick: (info: ContextMenuInfo) => {
        if (info.responseId) deleteResponse(info.responseId);
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
  ];
  return (
    <FakeDeviceControllerProvider>
      <PlaybackProvider>
        <PlaybackAutoAdvanceEnabler />
        <PlaybackAutoStart />
        <ResponseTimeline actions={actions} />
      </PlaybackProvider>
    </FakeDeviceControllerProvider>
  );
};
