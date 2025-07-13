import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { workerManager } from '../controllers/workerManager';
import { decodeAudioFile, getMonoPCMData } from '../controllers/audioChunker';
import { useAsyncWorkerJob } from '../components/dev/useAsyncWorkerJob';

const meta: Meta = {
  title: 'Dev/WaveformWorkerTest',
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () => {
    const { result, progress, loading, error, runJob } = useAsyncWorkerJob<{ waveform: number[] }, { processed: number; total: number }>();

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      runJob(async (onProgress) => {
        const audioBuffer = await decodeAudioFile(file);
        const pcm = getMonoPCMData(audioBuffer);
        const req = {
          type: 'waveform' as const,
          pcmBuffer: pcm.buffer,
          sampleRate: audioBuffer.sampleRate,
          numPoints: 1000,
        };
        return await workerManager.enqueueJob<typeof req, { waveform: number[] }>(
          'waveform',
          req,
          (progress) => {
            onProgress(progress);
          }
        );
      });
    };

    return (
      <div style={{ maxWidth: 1000, margin: '2rem auto', padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
        <h3>Waveform Worker Test</h3>
        <input type="file" accept="audio/*" onChange={handleFile} />
        {loading && progress && (
          <div>Progress: {((progress.processed / progress.total) * 100).toFixed(1)}%</div>
        )}
        {loading && !progress && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {result && result.waveform && (
          <svg width={1000} height={100} style={{ display: 'block', marginTop: 16, background: '#f8f8f8' }}>
            {result.waveform.map((v, i) =>
              i % 2 === 0 ? (
                <line
                  key={i}
                  x1={i / 2}
                  x2={i / 2}
                  y1={50 - result.waveform[i] * 48}
                  y2={50 - result.waveform[i + 1] * 48}
                  stroke="#333"
                  strokeWidth={1}
                />
              ) : null
            )}
          </svg>
        )}
      </div>
    );
  },
}; 