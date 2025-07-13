import type { IMixerEngine } from "./IMixerEngine";
import type { TimelineResponse } from "../TimelineVisuals";
import type { WebSRDriverController } from "../../../controllers/WebSRDriverController";

export class LEDEngine implements IMixerEngine {
  triggerResponse(rect: TimelineResponse, deviceControllers: WebSRDriverController[]): void {
    console.log("LEDEngine: triggerResponse", rect, deviceControllers);
    if (rect.data.pattern === "beat") {
      this._responseToBeat(rect, deviceControllers);
    } else if (rect.data.pattern === "fade") {
      this._responseToFade(rect, deviceControllers);
    } else {
      this._respondToSingleFirePattern(rect, deviceControllers);
    }
  }

  private _responseToFade(rect: TimelineResponse, deviceControllers: WebSRDriverController[]): void {
    console.log("LEDEngine: _responseToFade", rect, deviceControllers);
    deviceControllers.forEach(controller => {
      controller.fadeBrightness(rect.data?.targetBrightness as number || 200, rect.data?.durationMs as number || 500);
    });
  }


  private _responseToBeat(rect: TimelineResponse, deviceControllers: WebSRDriverController[]): void {
    console.log("LEDEngine: _responseToBeat", rect, deviceControllers);
    deviceControllers.forEach(controller => {
        controller.pulseBrightness(rect.data?.targetBrightness as number || 200, rect.data?.durationMs as number || 500);
    });
  }

  private _respondToSingleFirePattern(rect: TimelineResponse, deviceControllers: WebSRDriverController[]): void {
    console.log("LEDEngine: _respondToSingleFirePattern", rect, deviceControllers);
    if (rect.data.patternId) {
      deviceControllers.forEach(controller => {
        controller.firePattern(parseInt(rect.data.patternId as string), "(255,255,255)-(0,0,0)");
      });
    }
  }
}