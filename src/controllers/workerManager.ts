// workerManager.ts - Minimal worker manager for waveformWorker
// Types (inline for now, move to types.ts if needed)

import { logWorkerMessage } from '../store/appLogger';

type WorkerType = 'waveform' | 'fft' | 'aubio' | 'bandFilter' | 'visualization';

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
    console.log(`Enqueueing job ${typeof request}`);
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
    console.log(`posting message to worker: ${JSON.stringify(this.activeJob.jobId)}`);
    this.worker.postMessage({ ...this.activeJob.request, jobId: this.activeJob.jobId });
  }

  private handleMessage(e: MessageEvent) {
    if (e.data && e.data.type === 'log') {
      logWorkerMessage(e.data.message, e.data);
      return;
    }
    if (!this.activeJob) return;
    if (e.data && e.data.type === 'progress' && this.activeJob.onProgress) {
      this.activeJob.onProgress(e.data);
      return;
    }
    // Only log jobId for non-log messages
    if (e.data && 'jobId' in e.data) {
      console.log(`handleMessage: ${JSON.stringify(e.data.jobId)}`);
    }
    this.activeJob.resolve(e.data);
    this.activeJob = null;
    this.status = 'idle';
    this.processQueue();
  }

  private handleError(e: ErrorEvent) {
    // console.log(`handleError: ${JSON.stringify(e)}`);
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
    bandFilter: new WorkerHandle('../workers/bandFilterWorker.ts'),
    visualization: new WorkerHandle('./visualizationWorker.ts'),
  };

  getInfo() {

    // Accumulate info from all handles
    const info = {
      totalQueued: 0,
      totalActive: 0,
      jobs: [] as { type: WorkerType; status: 'idle' | 'busy'; queueSize: number }[],
    };
    for (const [type, handle] of Object.entries(this.handles)) {
      info.totalQueued += handle.getQueueSize();
      info.totalActive += handle.getStatus() === 'busy' ? 1 : 0;
      info.jobs.push({
        type: type as WorkerType,
        status: handle.getStatus(),
        queueSize: handle.getQueueSize(),
      });
    }
    return info;
  }

  enqueueJob<T, U>(type: WorkerType, request: T, onProgress?: (progress: { processed: number; total: number; jobId?: string }) => void): Promise<U> {
    function isAubioRequest(obj: unknown): obj is { audioBuffer: Float32Array | ArrayBuffer; sampleRate: number } {
      return !!obj && typeof obj === 'object' && 'audioBuffer' in obj && 'sampleRate' in obj;
    }
    if (type === 'aubio' && isAubioRequest(request)) {
      const buffer = request.audioBuffer;
      const bufferLen = (buffer instanceof Float32Array || buffer instanceof ArrayBuffer)
        ? (buffer instanceof Float32Array ? buffer.length : buffer.byteLength)
        : 0;
      console.log(`[MANAGER] enqueueJob aubio { sampleRate: ${request.sampleRate}, bufferLength: ${bufferLen} }`);
    } else {
      console.log(`[MANAGER] enqueueJob ${type}`);
    }
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