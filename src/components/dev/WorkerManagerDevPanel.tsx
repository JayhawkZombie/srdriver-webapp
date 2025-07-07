import React from 'react';
// TODO: Replace 'any' with proper WorkerManager type
import { workerManager } from '../../controllers/workerManager';

export const WorkerManagerDevPanel: React.FC = () => {
  // TODO: Replace 'any' with proper stats type
  const [stats, setStats] = React.useState<any>({
    queued: 0,
    running: 0,
    completed: 0,
    recent: [] as any[],
  });

  React.useEffect(() => {
    // TODO: Replace with real event subscription when available
    const update = () => {
      setStats({
        queued: workerManager.getQueueLength?.() ?? 0, // TODO: Implement in workerManager
        running: workerManager.getActiveJobCount?.() ?? 0, // TODO: Implement in workerManager
        completed: workerManager.getCompletedJobCount?.() ?? 0, // TODO: Implement in workerManager
        recent: workerManager.getRecentEvents?.() ?? [], // TODO: Implement in workerManager
      });
    };
    // TODO: Implement event emitter in workerManager
    // workerManager.on?.('update', update);
    update();
    // return () => workerManager.off?.('update', update);
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, background: '#222', color: '#fff', padding: 16, zIndex: 10000, minWidth: 320 }}>
      <h4 style={{ margin: 0, marginBottom: 8 }}>Worker Manager (Dev)</h4>
      <div>Queued: {stats.queued}</div>
      <div>Running: {stats.running}</div>
      <div>Completed: {stats.completed}</div>
      <div style={{ marginTop: 8, maxHeight: 120, overflow: 'auto', fontSize: 12 }}>
        <strong>Recent Events:</strong>
        <ul style={{ paddingLeft: 16 }}>
          {stats.recent.map((evt: any, i: number) => (
            <li key={i}>{JSON.stringify(evt)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 