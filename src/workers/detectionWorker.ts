import { detectionEngines } from './detectionEngines';

self.onmessage = async (e: MessageEvent) => {
  const { engine, pcm, sampleRate, params } = e.data;
  if (!engine || !detectionEngines[engine]) {
    self.postMessage({ error: 'Invalid or missing detection engine' });
    return;
  }
  try {
    const onProgress = (processed: number, total: number) => {
      self.postMessage({ type: 'progress', processed, total });
    };
    const result = await detectionEngines[engine].detect(pcm, sampleRate, params || {}, onProgress);
    self.postMessage({ type: 'done', result });
  } catch (err) {
    let message = 'Unknown error';
    if (isErrorWithMessage(err)) {
      message = err.message;
    } else {
      message = String(err);
    }
    self.postMessage({ error: message });
  }
};

function isErrorWithMessage(e: unknown): e is { message: string } {
  return typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string';
} 