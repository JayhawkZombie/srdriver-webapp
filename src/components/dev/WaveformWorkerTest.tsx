import React, { useState } from 'react';
import { workerManager } from '../../controllers/workerManager';
import { decodeAudioFile, getMonoPCMData } from '../../controllers/audioChunker';

export const WaveformWorkerTest: React.FC = () => {
  const [waveform, setWaveform] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setWaveform(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const audioBuffer = await decodeAudioFile(file);
      const pcm = getMonoPCMData(audioBuffer);
      const req = {
        type: 'waveform' as const,
        pcmBuffer: pcm.buffer,
        sampleRate: audioBuffer.sampleRate,
        numPoints: 1000,
      };
      const result = await workerManager.enqueueJob<typeof req, { waveform: number[] }>('waveform', req);
      setWaveform(result.waveform);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
      <h3>Waveform Worker Test</h3>
      <input type="file" accept="audio/*" onChange={handleFile} />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {waveform && (
        <svg width={1000} height={100} style={{ display: 'block', marginTop: 16, background: '#f8f8f8' }}>
          {/* Draw min/max waveform */}
          {waveform.map((v, i) =>
            i % 2 === 0 ? (
              <line
                key={i}
                x1={i / 2}
                x2={i / 2}
                y1={50 - waveform[i] * 48}
                y2={50 - waveform[i + 1] * 48}
                stroke="#333"
                strokeWidth={1}
              />
            ) : null
          )}
        </svg>
      )}
    </div>
  );
};

export default WaveformWorkerTest; 