export interface MixerResponseInfo {
  type: string;
  patternId: number;
  [key: string]: any;
}

export class Mixer {
  // private ledEngine: LedEngine;

  constructor() {
    
  }
  // constructor(ledEngine: LedEngine) {
  //   this.ledEngine = ledEngine;
  // }

  triggerResponse(info: MixerResponseInfo) {
    console.log("Mixer triggerResponse", info);
    if (info.type === 'led') {
      // You can expand this logic for more complex pattern args
      // this.ledEngine.firePattern(info.patternId, info.args || {});
    }
    // Add more types (audio, etc.) as needed
  }
} 