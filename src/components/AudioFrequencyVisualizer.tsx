import React from 'react';
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
  // maxSlices = 64, // unused for this plot
}) => {
  const displaySequence = fftSequence;
  const numBins = displaySequence[0]?.length || 0;
  if (numBins === 0) return null;

  // X axis: time (chunk index)
  const times = Array.from({ length: displaySequence.length }, (_, i) => i);
  // Frequency for each bin
  const freqs = Array.from({ length: numBins }, (_, i) => (i * sampleRate) / (2 * numBins));

  // For each band, find the closest bin index
  const bandTraces = STANDARD_BANDS.map(band => {
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
    return {
      x: times,
      y: magnitudes,
      type: 'scatter',
      mode: 'lines',
      name: band.name + ` (${Math.round(freqs[binIdx])} Hz)`,
      line: { color: band.color, width: 2 },
    };
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
    }}>
      <h3 style={{ marginBottom: 16 }}>Frequency Band Magnitude Over Time</h3>
      <Plot
        data={bandTraces}
        layout={{
          width: 650,
          height: 350,
          margin: { l: 60, r: 30, t: 30, b: 60 },
          xaxis: {
            title: 'Time (chunk index)',
            automargin: true,
          },
          yaxis: {
            title: 'Magnitude',
            automargin: true,
          },
          legend: { orientation: 'h', y: -0.2 },
          paper_bgcolor: '#fafbfc',
          plot_bgcolor: '#fafbfc',
        }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
};

export default AudioFrequencyVisualizer; 