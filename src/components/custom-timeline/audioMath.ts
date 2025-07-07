// audioMath.ts - utilities for audio analysis and visualization

/**
 * Returns the index of the maximum absolute value in a 1D array.
 */
export function getPeakIndex(data: number[]): number {
  let peakIdx = 0;
  let peakVal = Math.abs(data[0] || 0);
  for (let i = 1; i < data.length; i++) {
    if (Math.abs(data[i]) > peakVal) {
      peakVal = Math.abs(data[i]);
      peakIdx = i;
    }
  }
  return peakIdx;
}

/**
 * For 2D data (e.g., spectrogram), returns an array of row indices of the max value for each column.
 * Each entry is the row index of the max value in that column.
 */
export function getPeakIndices2D(data: number[][]): number[] {
  return data.map(col => {
    let maxIdx = 0;
    let maxVal = col[0];
    for (let i = 1; i < col.length; i++) {
      if (col[i] > maxVal) {
        maxVal = col[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  });
}

/**
 * Maps waveform amplitude data to SVG polyline points string.
 * Amplitudes should be in [-1, 1].
 */
export function waveformToSvgPoints(data: number[], width: number, height: number): string {
  const len = data.length;
  return data.map((amp, i) => {
    const x = (i / (len - 1)) * width;
    // SVG y=0 is top, so invert amplitude
    const y = height / 2 - (amp * (height / 2));
    return `${x},${y}`;
  }).join(' ');
}

/**
 * Returns the SVG coordinates (x, y) for the peak index in a waveform.
 * Amplitudes should be in [-1, 1].
 */
export function getPeakCoordinate(
  data: number[],
  peakIdx: number,
  width: number,
  height: number
): [number, number] {
  const len = data.length;
  const peakX = (peakIdx / (len - 1)) * width;
  const peakY = height / 2 - (data[peakIdx] * (height / 2));
  return [peakX, peakY];
} 