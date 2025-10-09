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
  const currentCommand = useRef<string>('');

  // Cleanup/reset
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    setProgress({ received: 0, total: null });
    chunksReceived.current = 0;
    totalChunks.current = null;
    currentCommand.current = '';
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
    currentCommand.current = command;

    client.setOnChunk((chunk: ChunkEnvelope) => {
      chunksReceived.current += 1;
      if (chunk.n) totalChunks.current = chunk.n;
      setProgress({ received: chunksReceived.current, total: totalChunks.current });
    });
    
    client.setOnComplete((result) => {
      setLoading(false);
      if (Array.isArray(result)) {
        // PRINT/file: result is ChunkEnvelope[]
        // Decode each chunk's base64 to binary, then concatenate
        const binaryChunks = result.map(env => Uint8Array.from(atob(env.p), c => c.charCodeAt(0)));
        const totalLength = binaryChunks.reduce((sum, arr) => sum + arr.length, 0);
        const fullBinary = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of binaryChunks) {
          fullBinary.set(chunk, offset);
          offset += chunk.length;
        }
        // Try to decode as UTF-8 text
        let decoded: string | Uint8Array;
        let isText = false;
        try {
          const text = new TextDecoder('utf-8', { fatal: false }).decode(fullBinary);
          if (/\uFFFD/.test(text) || /[\0]{4,}/.test(text)) {
            decoded = fullBinary;
            isText = false;
          } else {
            decoded = text;
            isText = true;
          }
        } catch {
          decoded = fullBinary;
          isText = false;
        }
        console.log('[useSDCardStream] PRINT decoded:', { isText, length: fullBinary.length });
        setData(decoded as T);
      } else if (typeof result === 'string') {
        // LIST/JSON: result is string
        try {
          const parsed = JSON.parse(result);
          setData(parsed as T);
        } catch (parseError) {
          setError('Failed to parse SD card response');
        }
      } else {
        setError('Unknown SD card response type');
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