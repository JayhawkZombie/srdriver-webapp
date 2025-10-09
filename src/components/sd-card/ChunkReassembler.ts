// ChunkReassembler.ts

export type ChunkEnvelope = {
  t: string; // type
  s: number; // sequence number (1-based)
  n: number; // total number of chunks
  p: string; // payload
  e: boolean; // end of stream
  f?: string; // filename (optional)
  b?: boolean; // base64 flag (optional)
};

export class ChunkReassembler {
  private buffer: Map<number, ChunkEnvelope> = new Map();
  private expectedTotal: number | null = null;
  private lastType: string | null = null;

  addChunk(chunk: ChunkEnvelope): string | ChunkEnvelope[] | null {
    console.log('[ChunkReassembler] Adding chunk:', {
      s: chunk.s,
      n: chunk.n,
      e: chunk.e,
      t: chunk.t,
      pLength: chunk.p?.length || 0
    });
    this.buffer.set(chunk.s, chunk);
    this.lastType = chunk.t;
    // Update expected total if provided
    if (chunk.n) this.expectedTotal = chunk.n;
    console.log('[ChunkReassembler] Buffer size:', this.buffer.size, 'Expected total:', this.expectedTotal);

    // Check if we're done:
    const isDone = chunk.e || 
                   (this.expectedTotal && this.buffer.size === this.expectedTotal) ||
                   (chunk.s === 1 && chunk.e && (!chunk.n || chunk.n === 0));

    if (isDone) {
      let total: number;
      if (this.expectedTotal) {
        total = this.expectedTotal;
      } else if (chunk.n && chunk.n > 0) {
        total = chunk.n;
      } else {
        total = this.buffer.size;
      }
      // Reassemble in sequence order
      const envelopes = Array.from({ length: total }, (_, i) => {
        return this.buffer.get(i + 1) || { t: '', s: i + 1, n: total, p: '', e: false };
      });
      console.log('[ChunkReassembler] Reassembly complete. Total chunks:', total);
      this.buffer.clear();
      this.expectedTotal = null;
      // If this is a PRINT/file transfer (t: 'D'), return array of envelopes
      if (this.lastType === 'D') {
        return envelopes;
      } else {
        // For LIST or other JSON, concatenate payloads and return as string
        const full = envelopes.map(env => env.p).join('');
        return full;
      }
    }
    return null;
  }

  reset() {
    this.buffer.clear();
    this.expectedTotal = null;
    this.lastType = null;
  }
} 