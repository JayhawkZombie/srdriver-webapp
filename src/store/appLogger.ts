import { useAppStore } from './appStore';

export function logWorkerMessage(message: string, data?: unknown) {
  try {
    useAppStore.getState().addLog('info', 'worker', message, data);
  } catch (err) {
    // fallback to console
    // eslint-disable-next-line no-console
    console.log('[workerManager] Could not funnel worker log to app logger:', err, message, data);
  }
} 