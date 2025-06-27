import FFT from 'fft.js';

/**
 * Computes the FFT magnitude spectrum for a chunk of PCM data.
 * @param chunk Float32Array of PCM data (length must be a power of 2)
 * @returns Float32Array of magnitudes (length = chunk.length / 2)
 */
export function computeFFTMagnitude(chunk: Float32Array): Float32Array {
  const fft = new FFT(chunk.length);
  const input = new Array(chunk.length).fill(0);
  for (let i = 0; i < chunk.length; i++) input[i] = chunk[i];

  const out = fft.createComplexArray();
  fft.realTransform(out, input);
  fft.completeSpectrum(out);

  // Compute magnitude for each frequency bin (only first half is unique for real input)
  const magnitudes = new Float32Array(chunk.length / 2);
  for (let i = 0; i < magnitudes.length; i++) {
    const re = out[2 * i];
    const im = out[2 * i + 1];
    magnitudes[i] = Math.sqrt(re * re + im * im);
  }
  return magnitudes;
} 