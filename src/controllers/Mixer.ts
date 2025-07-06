import { LedEngine } from './LedEngine';

export interface MixerResponseInfo {
  type: 'led';
  patternId: number;
  [key: string]: any;
}

export class Mixer {
  private ledEngine: LedEngine;

  constructor(ledEngine: LedEngine) {
    this.ledEngine = ledEngine;
  }

  triggerResponse(info: MixerResponseInfo) {
    if (info.type === 'led') {
      // You can expand this logic for more complex pattern args
      this.ledEngine.firePattern(info.patternId, info.args || {});
    }
    // Add more types (audio, etc.) as needed
  }
} 