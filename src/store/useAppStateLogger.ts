import { useAppStore } from './appStore';

export function useAppStateLogger(defaultCategory?: string) {
  const addLog = useAppStore(s => s.addLog);

  function log(
    message: string,
    data?: any,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info',
    category?: string
  ) {
    addLog(level, category || defaultCategory || 'general', message, data);
  }

  log.info = (msg: string, data?: any, category?: string) => log(msg, data, 'info', category);
  log.warn = (msg: string, data?: any, category?: string) => log(msg, data, 'warn', category);
  log.error = (msg: string, data?: any, category?: string) => log(msg, data, 'error', category);
  log.debug = (msg: string, data?: any, category?: string) => log(msg, data, 'debug', category);

  return log;
} 