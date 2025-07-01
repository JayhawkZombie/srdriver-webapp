import React, { useRef, useEffect } from 'react';

interface SpectrogramRendererProps {
  audioBuffer: AudioBuffer | null;
  fftSequence: (Float32Array | number[])[];
}

const CANVAS_HEIGHT = 200;
const CANVAS_WIDTH = 900;

function getColor(mag: number) {
  // Simple grayscale mapping, can be improved
  const v = Math.max(0, Math.min(255, Math.floor(255 * mag)));
  return `rgb(${v},${v},${v})`;
}

const SpectrogramRenderer: React.FC<SpectrogramRendererProps> = ({ audioBuffer, fftSequence }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  console.log('SpectrogramRenderer:', { audioBuffer, fftSequence, fftLen: fftSequence?.length });

  useEffect(() => {
    if (!audioBuffer || !fftSequence || fftSequence.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const nFrames = fftSequence.length;
    const nBins = fftSequence[0]?.length || 0;
    // Draw each FFT frame as a vertical line of pixels
    for (let t = 0; t < nFrames; t++) {
      const frame = fftSequence[t];
      for (let f = 0; f < nBins; f++) {
        // Normalize magnitude for color mapping
        const mag = Math.log10(Math.max(1e-8, (frame[f] as number))) + 8; // log scale, shift to [0,8]
        const norm = Math.max(0, Math.min(1, mag / 8));
        ctx.fillStyle = getColor(norm);
        const x = Math.floor((t / nFrames) * CANVAS_WIDTH);
        const y = Math.floor(CANVAS_HEIGHT - (f / nBins) * CANVAS_HEIGHT);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [audioBuffer, fftSequence]);

  if (!audioBuffer || !fftSequence || fftSequence.length === 0) {
    return (
      <div style={{ width: '100%', height: CANVAS_HEIGHT, background: '#222', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        Spectrogram will appear here (no audio loaded)
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      // width={CANVAS_WIDTH}
      width={"100%"}
      height={CANVAS_HEIGHT}
      style={{ width: '100%', height: CANVAS_HEIGHT, background: '#222', borderRadius: 8, display: 'block' }}
    />
  );
};

export default SpectrogramRenderer; 