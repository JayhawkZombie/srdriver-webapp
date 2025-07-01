import React, { useRef, useEffect } from 'react';

interface BandOverlayCanvasProps {
  magnitudes: number[];
  playhead: number;
  duration: number;
  width: number;
  height: number;
}

const BandOverlayCanvas: React.FC<BandOverlayCanvasProps> = ({ magnitudes, playhead, duration, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    // Draw band line
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < magnitudes.length; i++) {
      const x = (i / (magnitudes.length - 1)) * width;
      // Normalize magnitude to [0, 1] and flip Y
      const norm = Math.max(0, Math.min(1, magnitudes[i]));
      const y = height - norm * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Draw playhead
    const playheadX = (playhead / duration) * width;
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [magnitudes, playhead, duration, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        zIndex: 2,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    />
  );
};

export default BandOverlayCanvas; 