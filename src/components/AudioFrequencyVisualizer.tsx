import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';

interface AudioFrequencyVisualizerProps {
  /**
   * Sequence of FFT magnitude arrays (each is a Float32Array or number[])
   * Each array represents one time slice (row in the spectrogram)
   */
  fftSequence: (Float32Array | number[])[];
  /**
   * Sample rate of the audio (Hz)
   */
  sampleRate: number;
  /**
   * FFT window size (number of samples per FFT)
   */
  windowSize: number;
  /**
   * Max number of time slices to display (for scrolling effect)
   */
  maxSlices?: number;
  /**
   * Hop size (number of samples between consecutive FFTs)
   */
  hopSize: number;
  /**
   * The decoded AudioBuffer for playback (optional)
   */
  audioBuffer?: AudioBuffer;
}

// Standard frequency bands (Hz) and colors
const STANDARD_BANDS = [
  { name: 'Bass', freq: 60, color: 'blue' },
  { name: 'Low Mid', freq: 250, color: 'green' },
  { name: 'Mid', freq: 1000, color: 'orange' },
  { name: 'Treble', freq: 4000, color: 'red' },
  { name: 'High Treble', freq: 8000, color: 'purple' },
];

const AudioFrequencyVisualizer: React.FC<AudioFrequencyVisualizerProps> = ({
  fftSequence,
  sampleRate,
  windowSize,
  hopSize,
  audioBuffer,
  // maxSlices = 64, // unused for this plot
}) => {
  // --- Playback state (move hooks to top) ---
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, etc.
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Audio playback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0); // When audio started (context time)
  const pausedAtRef = useRef<number>(0); // Where we paused

  const displaySequence = fftSequence;
  const numBins = displaySequence[0]?.length || 0;

  // X axis: time (seconds)
  const times = Array.from({ length: displaySequence.length }, (_, i) => (i * hopSize) / sampleRate);
  // Determine the max time
  const maxTime = times.length > 0 ? times[times.length - 1] : 0;
  // Show the entire song at once
  let xRange: [number, number] = [0, maxTime];
  // Frequency for each bin
  const freqs = Array.from({ length: numBins }, (_, i) => (i * sampleRate) / (2 * numBins));

  // --- Audio playback logic ---
  // Clean up audio context and source
  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Start audio at a given offset
  const startAudio = (offset: number) => {
    if (!audioBuffer) return;
    stopAudio();
    const ctx = new window.AudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0, offset);
    audioContextRef.current = ctx;
    sourceNodeRef.current = source;
    playbackStartTimeRef.current = ctx.currentTime - offset;
    // When audio ends, pause
    source.onended = () => {
      setIsPlaying(false);
      setPlaybackTime(maxTime);
      stopAudio();
    };
  };

  // Start/stop timer and audio
  useEffect(() => {
    if (isPlaying) {
      if (audioBuffer) {
        // Start audio playback
        startAudio(playbackTime);
        // Sync playbackTime to audio context
        intervalRef.current = setInterval(() => {
          const ctx = audioContextRef.current;
          if (ctx) {
            const t = ctx.currentTime - playbackStartTimeRef.current;
            setPlaybackTime(t > maxTime ? maxTime : t);
            if (t >= maxTime) {
              setIsPlaying(false);
              stopAudio();
            }
          }
        }, 50);
      } else {
        // Fallback: timer only
        intervalRef.current = setInterval(() => {
          setPlaybackTime((prev) => {
            const next = prev + 0.05 * playbackSpeed; // 50ms steps
            return next > maxTime ? maxTime : next;
          });
        }, 50);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopAudio();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAudio();
    };
    // eslint-disable-next-line
  }, [isPlaying, playbackSpeed, maxTime, audioBuffer]);

  // Reset playback if new data is loaded (only when fftSequence length goes from 0 to >0)
  useEffect(() => {
    if (fftSequence.length > 0) {
      setPlaybackTime(0);
      setIsPlaying(false);
      pausedAtRef.current = 0;
      stopAudio();
    }
    // eslint-disable-next-line
  }, [fftSequence.length]);

  if (numBins === 0) return null;

  // Controls
  const handlePlay = () => {
    setIsPlaying(true);
  };
  const handlePause = () => {
    setIsPlaying(false);
    pausedAtRef.current = playbackTime;
  };
  const handleReset = () => {
    setPlaybackTime(0);
    setIsPlaying(false);
    pausedAtRef.current = 0;
    stopAudio();
  };
  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => setPlaybackSpeed(Number(e.target.value));

  // --- Band plots with playback cursor ---
  const bandPlots = STANDARD_BANDS.map(band => {
    // Find the bin closest to the band's frequency
    let binIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < freqs.length; i++) {
      const diff = Math.abs(freqs[i] - band.freq);
      if (diff < minDiff) {
        minDiff = diff;
        binIdx = i;
      }
    }
    // Extract the magnitude for this bin over all chunks
    const magnitudes = displaySequence.map(row => row[binIdx] ?? 0);
    // Compute the derivative (finite difference)
    const derivatives = magnitudes.map((v, i, arr) => i === 0 ? 0 : v - arr[i - 1]);
    // Cursor as a trace (vertical line)
    const cursorTrace = {
      x: [playbackTime, playbackTime],
      y: [0, Math.max(Math.max(...magnitudes) * 1.1, 1)],
      type: 'scatter',
      mode: 'lines',
      line: { color: 'red', width: 4, dash: 'solid' },
      name: 'Cursor',
      showlegend: false,
    };
    return (
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ color: band.color, margin: '8px 0' }}>{band.name} ({Math.round(freqs[binIdx])} Hz)</h4>
        <Plot
          data={[
            {
              x: times,
              y: magnitudes,
              type: 'scatter',
              mode: 'lines',
              line: { color: band.color, width: 2 },
              name: band.name,
            },
            {
              x: times,
              y: derivatives,
              type: 'scatter',
              mode: 'lines',
              line: { color: 'magenta', width: 2, dash: 'dash' },
              name: band.name + ' Rate of Change',
              yaxis: 'y2',
            },
            cursorTrace,
          ]}
          layout={{
            height: 120,
            margin: { l: 60, r: 30, t: 30, b: 40 },
            xaxis: {
              title: 'Time (seconds)',
              automargin: true,
              range: xRange,
            },
            yaxis: {
              title: 'Magnitude',
              automargin: true,
            },
            yaxis2: {
              overlaying: 'y',
              side: 'right',
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            paper_bgcolor: '#fafbfc',
            plot_bgcolor: '#fafbfc',
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </div>
    );
  });

  return (
    <div style={{
      maxWidth: 700,
      margin: '2rem auto',
      padding: '1rem',
      border: '1px solid #ccc',
      borderRadius: 8,
      background: '#fafbfc',
      maxHeight: 600,
      overflowY: 'auto',
      overflowX: 'auto',
    }}>
      <h3 style={{ marginBottom: 16 }}>Frequency Band Magnitude Over Time</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <button onClick={handlePlay} disabled={isPlaying || playbackTime >= maxTime}>Play</button>
        <button onClick={handlePause} disabled={!isPlaying}>Pause</button>
        <button onClick={handleReset}>Reset</button>
        <label style={{ marginLeft: 16 }}>
          Speed:
          <select value={playbackSpeed} onChange={handleSpeedChange} style={{ marginLeft: 8 }}>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
            <option value={8}>8x</option>
          </select>
        </label>
        <span style={{ marginLeft: 16 }}>Time: {playbackTime.toFixed(2)}s / {maxTime.toFixed(2)}s</span>
      </div>
      {bandPlots}
    </div>
  );
};

export default AudioFrequencyVisualizer; 