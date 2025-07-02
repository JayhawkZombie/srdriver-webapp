import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveSurferSpectrogramProps {
  audioBuffer: AudioBuffer;
  isPlaying: boolean;
  playhead: number; // seconds
  onSeek: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  duration: number;
  width?: number; // NEW: width in px
}

// Utility: Convert AudioBuffer to WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const samples: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    samples.push(buffer.getChannelData(i));
  }
  const length = samples[0].length;
  const interleaved = new Float32Array(length * numChannels);
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      interleaved[i * numChannels + ch] = samples[ch][i];
    }
  }
  // Convert to 16-bit PCM
  const pcm = new DataView(new ArrayBuffer(interleaved.length * 2));
  for (let i = 0; i < interleaved.length; i++) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    pcm.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  // WAV header
  const wav = new Uint8Array(44 + pcm.byteLength);
  const view = new DataView(wav.buffer);
  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true);
  view.setUint16(32, numChannels * bitDepth / 8, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  new Uint8Array(wav.buffer, 44).set(new Uint8Array(pcm.buffer));
  return new Blob([wav], { type: 'audio/wav' });
}

const WaveSurferSpectrogram: React.FC<WaveSurferSpectrogramProps> = ({
  audioBuffer,
  isPlaying,
  playhead,
  onSeek,
  onPlayPause,
  duration,
  width, // NEW
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !audioBuffer) return;
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#888',
      progressColor: '#1976d2',
      height: 128,
      interact: true,
      backend: 'WebAudio',
      normalize: true,
      ...(width ? { width } : {}),
    });
    wavesurferRef.current = ws;
    // Convert AudioBuffer to WAV Blob and load
    const blob = audioBufferToWavBlob(audioBuffer);
    ws.loadBlob(blob);
    ws.once('ready', () => {
      ws.seekTo(playhead / duration);
      if (isPlaying) ws.play();
    });
    ws.on('play', () => onPlayPause(true));
    ws.on('pause', () => onPlayPause(false));
    ws.on('interaction', () => {
      onSeek(ws.getCurrentTime());
    });
    return () => {
      ws.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBuffer, width]);

  // Sync playhead externally
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    const current = ws.getCurrentTime();
    if (Math.abs(current - playhead) > 0.05) {
      ws.seekTo(playhead / duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playhead]);

  // Sync play/pause externally
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    if (isPlaying && !ws.isPlaying()) {
      ws.play();
    } else if (!isPlaying && ws.isPlaying()) {
      ws.pause();
    }
  }, [isPlaying]);

  return (
    <div style={{ width: width ? width : '100%', marginBottom: 12 }}>
      <div ref={containerRef} style={{ width: width ? width : '100%', height: 128, borderRadius: 12, background: '#181c20' }} />
    </div>
  );
};

export default WaveSurferSpectrogram; 