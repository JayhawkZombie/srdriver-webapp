import type { IMixerEngine } from "./IMixerEngine";
import type { TimelineResponse } from "../TimelineVisuals";
import type { WebSRDriverController } from "../../../controllers/WebSRDriverController";

export class LEDEngine implements IMixerEngine {
  triggerResponse(rect: TimelineResponse, deviceControllers: WebSRDriverController[]): void {
    console.log("LEDEngine: triggerResponse", rect, deviceControllers);
    this._respondToSingleFirePattern(rect, deviceControllers);
  }




  private _respondToSingleFirePattern(rect: TimelineResponse, deviceControllers: WebSRDriverController[]): void {
    console.log("LEDEngine: _respondToSingleFirePattern", rect, deviceControllers);
    const {pattern} = rect.data;
    if (pattern === "beat") {
        deviceControllers.forEach(controller => {
            controller.pulseBrightness(255, 500);
        });
    }
  }
}