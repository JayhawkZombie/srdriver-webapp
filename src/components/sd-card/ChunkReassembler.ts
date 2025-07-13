// ChunkReassembler.ts

export type ChunkEnvelope = {
  t: string; // type
  s: number; // sequence number (1-based)
  n: number; // total number of chunks
  p: string; // payload
  e: boolean; // end of stream
};

export class ChunkReassembler {
  private buffer: Map<number, string> = new Map();
  private expectedTotal: number | null = null;

  addChunk(chunk: ChunkEnvelope): string | null {
    console.log('[ChunkReassembler] Adding chunk:', {
      s: chunk.s,
      n: chunk.n,
      e: chunk.e,
      t: chunk.t,
      pLength: chunk.p?.length || 0
    });
    this.buffer.set(chunk.s, chunk.p);
    
    // Update expected total if provided
    if (chunk.n) this.expectedTotal = chunk.n;
    console.log('[ChunkReassembler] Buffer size:', this.buffer.size, 'Expected total:', this.expectedTotal);

    // Check if we're done:
    // 1. If e: true (end flag), we're done
    // 2. If we have all expected chunks (n > 0 and buffer.size === n)
    // 3. If it's a single chunk (n === 0 or missing, e: true)
    const isDone = chunk.e || 
                   (this.expectedTotal && this.buffer.size === this.expectedTotal) ||
                   (chunk.s === 1 && chunk.e && (!chunk.n || chunk.n === 0));

    if (isDone) {
      // Determine total chunks to reassemble
      let total: number;
      if (this.expectedTotal) {
        total = this.expectedTotal;
      } else if (chunk.n && chunk.n > 0) {
        total = chunk.n;
      } else {
        // Single chunk or unknown total - use what we have
        total = this.buffer.size;
      }

      // Reassemble in sequence order
      const full = Array.from({ length: total }, (_, i) => {
        const chunkData = this.buffer.get(i + 1);
        return chunkData || '';
      }).join('');

      console.log('[ChunkReassembler] Reassembly complete. Total chunks:', total, 'Full length:', full.length);
      // Clear buffer for next response
      this.buffer.clear();
      this.expectedTotal = null;
      
      return full;
    }
    
    return null; // Not done yet
  }

  reset() {
    this.buffer.clear();
    this.expectedTotal = null;
  }
} 