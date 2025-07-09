import type { IMixerEngine } from "../components/custom-timeline/engines/IMixerEngine";
import type { WebSRDriverController } from "./WebSRDriverController";
import { LEDEngine } from "../components/custom-timeline/engines/LEDEngine";
import type { TimelineResponse } from "../components/custom-timeline/TimelineVisuals";

export interface MixerResponseInfo {
  type: string;
  patternId: number;
  [key: string]: any;
}

export class Mixer {
  private ledEngine: LEDEngine;

  constructor() {
    this.ledEngine = new LEDEngine();
  }
  // constructor(ledEngine: LedEngine) {
  //   this.ledEngine = ledEngine;
  // }

  triggerResponse(info: TimelineResponse, deviceControllers: WebSRDriverController[]) {
    console.log("Mixer triggerResponse", info, deviceControllers);
    if (info.data?.type === 'led') {
      this.ledEngine.triggerResponse(info, deviceControllers);
    }
    // Add more types (audio, etc.) as needed
  }
} 