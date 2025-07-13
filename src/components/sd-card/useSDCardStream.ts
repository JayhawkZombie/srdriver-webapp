import { useCallback, useRef, useState } from 'react';
import type { SDCardBLEClient } from './SDCardBLEClient';
import type { ChunkEnvelope } from './ChunkReassembler';

export type SDCardStreamState<T = unknown> = {
  loading: boolean;
  error: string | null;
  data: T | null;
  progress: { received: number; total: number | null };
  sendCommand: (command: string, arg?: string) => void;
  reset: () => void;
};

export function useSDCardStream<T = unknown>(client: SDCardBLEClient | null): SDCardStreamState<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [progress, setProgress] = useState<{ received: number; total: number | null }>({ received: 0, total: null });
  const chunksReceived = useRef(0);
  const totalChunks = useRef<number | null>(null);

  // Cleanup/reset
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    setProgress({ received: 0, total: null });
    chunksReceived.current = 0;
    totalChunks.current = null;
    if (client) client.reset();
  }, [client]);

  // Send a command and start streaming
  const sendCommand = useCallback((command: string, arg?: string) => {
    if (!client) {
      setError('No SD card BLE client available');
      return;
    }
    reset();
    setLoading(true);
    setError(null);
    setData(null);
    setProgress({ received: 0, total: null });
    chunksReceived.current = 0;
    totalChunks.current = null;

    client.setOnChunk((chunk: ChunkEnvelope) => {
      chunksReceived.current += 1;
      if (chunk.n) totalChunks.current = chunk.n;
      setProgress({ received: chunksReceived.current, total: totalChunks.current });
    });
    client.setOnComplete((fullJson: string) => {
      setLoading(false);
      try {
        setData(JSON.parse(fullJson));
      } catch {
        setError('Failed to parse SD card response');
      }
    });
    try {
      const fullCommand = arg ? `${command} ${arg}` : command;
      console.log('[useSDCardStream] Sending BLE command:', fullCommand);
      client.sendCommand(fullCommand);
    } catch (err) {
      setLoading(false);
      setError('Failed to send SD card command');
      console.error('[useSDCardStream] Error sending BLE command:', err);
    }
  }, [client, reset]);

  return {
    loading,
    error,
    data,
    progress,
    sendCommand,
    reset,
  };
} 