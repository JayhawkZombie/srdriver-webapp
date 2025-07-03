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