import React, { useState } from 'react';
import { Typography, Box, Button, List, ListItem, CircularProgress } from '@mui/material';
import type { DetectionEvent } from '../upgrade/types';

// @ts-expect-error "needed import for aubioWorker"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const worker = new Worker(new URL('../../workers/aubioWorker.ts', import.meta.url), { type: 'module' });

const SAMPLE_URL = 'https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/voice-change-o-matic/audio/concert-crowd.ogg';

const TestHarnessContent: React.FC = () => {
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setEvents([]);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(SAMPLE_URL);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      worker.postMessage({
        audioBuffer: audioBuffer.getChannelData(0),
        sampleRate: audioBuffer.sampleRate,
        params: { hopSize: 512, method: 'default' },
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load or decode audio');
      setLoading(false);
    }
  };

  worker.onmessage = (e: MessageEvent) => {
    const { events, error } = e.data as { events: DetectionEvent[], error?: string };
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setEvents(events);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Testbed Harness
      </Typography>
      <Typography variant="body1" gutterBottom>
        Analyze a sample audio file using the new aubio.js worker and display detected onsets.
      </Typography>
      <Button variant="contained" onClick={handleAnalyze} disabled={loading} sx={{ mb: 2 }}>
        {loading ? 'Analyzing...' : 'Analyze Sample Audio'}
      </Button>
      {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      {events.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Detected Events:</Typography>
          <List dense>
            {events.map((ev, idx) => (
              <ListItem key={idx}>
                Time: {ev.time.toFixed(3)}s{ev.strength !== undefined ? `, Strength: ${ev.strength}` : ''}
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default TestHarnessContent; 