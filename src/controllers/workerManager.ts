// workerManager.ts - Minimal worker manager for waveformWorker
// Types (inline for now, move to types.ts if needed)

type WorkerType = 'waveform' | 'fft' | 'aubio';

interface WorkerJob<Request, Result> {
  jobId: string;
  request: Request;
  resolve: (result: Result) => void;
  reject: (err: any) => void;
  onProgress?: (progress: { processed: number; total: number; jobId?: string }) => void;
}

class WorkerHandle<Request, Result> {
  private worker: Worker;
  private queue: WorkerJob<Request, Result>[] = [];
  private activeJob: WorkerJob<Request, Result> | null = null;
  public status: 'idle' | 'busy' = 'idle';

  constructor(workerUrl: string) {
    this.worker = new Worker(new URL(workerUrl, import.meta.url), { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
  }

  enqueue(request: Request, onProgress?: (progress: { processed: number; total: number; jobId?: string }) => void): Promise<Result> {
    console.log(`Enqueueing job ${typeof request} ${JSON.stringify(request)}`);
    return new Promise((resolve, reject) => {
      const job: WorkerJob<Request, Result> = {
        jobId: crypto.randomUUID(),
        request,
        resolve,
        reject,
        onProgress,
      };
      this.queue.push(job);
      this.processQueue();
    });
  }

  private processQueue() {
    console.log(`Processing queue, activeJob: ${this.activeJob}, queue length: ${this.queue.length}`);
    if (this.activeJob || this.queue.length === 0) return;
    this.activeJob = this.queue.shift()!;
    this.status = 'busy';
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
    console.log(`posting message to worker: ${JSON.stringify(this.activeJob.request)}`);
    this.worker.postMessage({ ...this.activeJob.request, jobId: this.activeJob.jobId });
  }

  private handleMessage(e: MessageEvent) {
    console.log(`handleMessage: ${JSON.stringify(e.data)}`);
    if (!this.activeJob) return;
    if (e.data && e.data.type === 'progress' && this.activeJob.onProgress) {
      this.activeJob.onProgress(e.data);
      return;
    }
    this.activeJob.resolve(e.data);
    this.activeJob = null;
    this.status = 'idle';
    this.processQueue();
  }

  private handleError(e: ErrorEvent) {
    console.log(`handleError: ${JSON.stringify(e)}`);
    if (this.activeJob) {
      this.activeJob.reject(e.error || e.message);
      this.activeJob = null;
      this.status = 'idle';
      this.processQueue();
    }
  }

  getQueueSize() {
    return this.queue.length;
  }

  getStatus() {
    return this.status;
  }
}

// Singleton manager
class WorkerManager {
  private handles: Record<WorkerType, WorkerHandle<any, any>> = {
    waveform: new WorkerHandle('../workers/waveformWorker.ts'),
    fft: new WorkerHandle('../workers/audioWorker.ts'),
    aubio: new WorkerHandle('../workers/aubioWorker.ts'),
  };

  enqueueJob<T, U>(type: WorkerType, request: T, onProgress?: (progress: { processed: number; total: number; jobId?: string }) => void): Promise<U> {
    console.log(`[MANAGER] enqueueJob ${type} ${JSON.stringify(request)}`);
    return this.handles[type].enqueue(request, onProgress);
  }

  getStatus(type: WorkerType) {
    const handle = this.handles[type];
    return {
      status: handle.getStatus(),
      queueSize: handle.getQueueSize(),
    };
  }
}

export const workerManager = new WorkerManager(); 