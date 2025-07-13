import type { WebSRDriverController } from '../../controllers/WebSRDriverController';
import type { ChunkEnvelope } from './ChunkReassembler';
import { ChunkReassembler } from './ChunkReassembler';

export class SDCardBLEClient {
  private controller: WebSRDriverController;
  private onChunk: ((chunk: ChunkEnvelope) => void) | null = null;
  private onComplete: ((fullJson: string) => void) | null = null;
  private reassembler = new ChunkReassembler();

  constructor(controller: WebSRDriverController) {
    this.controller = controller;
    const commandChar = controller.getSDCardCommandCharacteristic();
    const streamChar = controller.getSDCardStreamCharacteristic();
    if (!commandChar || !streamChar) {
      throw new Error('SD card characteristics not available on this device/controller');
    }
    // Listen for stream notifications
    streamChar.addEventListener('characteristicvaluechanged', this.handleChunk);
  }

  // Send a LIST command (or any SD card command)
  async sendCommand(command: string) {
    const commandChar = this.controller.getSDCardCommandCharacteristic();
    if (!commandChar) throw new Error('No SD card command characteristic');
    const encoder = new TextEncoder();
    await commandChar.writeValue(encoder.encode(command));
  }

  // Set a callback for each chunk received
  setOnChunk(cb: (chunk: ChunkEnvelope) => void) {
    this.onChunk = cb;
  }

  // Set a callback for when the full response is reassembled
  setOnComplete(cb: (fullJson: string) => void) {
    this.onComplete = cb;
  }

  // Reset the reassembler state
  reset() {
    this.reassembler.reset();
  }

  // Internal: handle incoming BLE chunks
  private handleChunk = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (target && target.value) {
      const decoder = new TextDecoder();
      const chunkStr = decoder.decode(target.value);
      try {
        const chunk: ChunkEnvelope = JSON.parse(chunkStr);
        if (this.onChunk) this.onChunk(chunk);
        const full = this.reassembler.addChunk(chunk);
        if (full && this.onComplete) {
          this.onComplete(full);
        }
      } catch {
        // Optionally handle parse error
      }
    }
  };
} 