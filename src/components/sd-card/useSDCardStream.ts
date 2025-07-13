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
    
    client.setOnComplete((fullJson: string) => {
      setLoading(false);
      try {
        // Parse the JSON to check the command type
        const parsed = JSON.parse(fullJson);
        
        if (currentCommand.current === 'PRINT') {
          // For PRINT, decode base64 file content from the 'p' field
          if (parsed.c === 'PRINT' && typeof parsed.p === 'string') {
            try {
              // Decode base64 to binary
              const binary = Uint8Array.from(atob(parsed.p), c => c.charCodeAt(0));
              // Try to decode as UTF-8 text
              let decoded: string | Uint8Array;
              let isText = false;
              try {
                // TextDecoder is supported in all modern browsers
                const text = new TextDecoder('utf-8', { fatal: false }).decode(binary);
                // Heuristic: if text contains replacement chars or lots of nulls, treat as binary
                if (/\uFFFD/.test(text) || /[\0]{4,}/.test(text)) {
                  decoded = binary;
                  isText = false;
                } else {
                  decoded = text;
                  isText = true;
                }
              } catch {
                decoded = binary;
                isText = false;
              }
              console.log('[useSDCardStream] PRINT decoded:', { isText, length: binary.length });
              setData(decoded as T);
            } catch (e) {
              setError('Failed to decode base64 file content');
              console.error('[useSDCardStream] Base64 decode error:', e);
            }
          } else {
            setError('Invalid PRINT response format');
          }
        } else if (currentCommand.current === 'LIST') {
          // For LIST, return the parsed JSON for further processing
          setData(parsed as T);
        } else {
          // For other commands, return the parsed JSON
          setData(parsed as T);
        }
      } catch (parseError) {
        console.error('[useSDCardStream] Failed to parse response:', parseError);
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