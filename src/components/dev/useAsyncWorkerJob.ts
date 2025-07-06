import { useState, useCallback } from 'react';

export function useAsyncWorkerJob<Result, Progress = any>() {
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runJob = useCallback(
    async (jobFn: (onProgress: (p: Progress) => void) => Promise<Result>) => {
      setResult(null);
      setProgress(null);
      setError(null);
      setLoading(true);
      try {
        const res = await jobFn((p) => setProgress(p));
        setResult(res);
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, progress, loading, error, runJob };
} 