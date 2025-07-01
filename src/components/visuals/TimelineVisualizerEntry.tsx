import React from 'react';
import TimeTracks from '../testbed/TimeTracks';
// TODO: In the future, import/use audio analysis data props here

/**
 * Entry point for the new timeline/beat visualizer UI.
 * Renders only the timeline itself, without the testbed modal or extra chrome.
 */
const TimelineVisualizerEntry: React.FC = () => {
  // TODO: Accept props for audio analysis data (impulse, spectrogram, etc.)
  // and pass them to the timeline UI as needed.

  // Render only the timeline, not the modal/testbed wrapper
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <TimeTracks />
    </div>
  );
};

export default TimelineVisualizerEntry; 