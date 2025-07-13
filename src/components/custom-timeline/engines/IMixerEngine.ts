import type { TimelineResponse } from "../TimelineVisuals";
import type { WebSRDriverController } from "../../../controllers/WebSRDriverController";

/**
 * Generic interface for a timeline engine (e.g., LED, Audio, etc).
 * Engines are plain TypeScript classes, not React components.
 * They receive timeline events and a list of device controllers to act on.
 */
export interface IMixerEngine {
  triggerResponse(
    rect: TimelineResponse,
    deviceControllers: WebSRDriverController[]
  ): void;
}
