import type { LayoutDimensions } from "./types";

/**
 * Contract for drawing an LED buffer to a 2D canvas.
 * Layout (strip/matrix/ring) and display size are defined by the implementation.
 */
export interface ILEDArrangement {
	/** Canvas width needed to draw this arrangement. */
	readonly width: number;
	/** Canvas height needed to draw this arrangement. */
	readonly height: number;
	/** Number of LEDs (length of buffer = numLeds * 3). */
	readonly numLeds: number;
	/** Layout shape and dimensions. */
	readonly layout: LayoutDimensions;
	/** Draw the RGB buffer (3 bytes per LED) to the canvas context. */
	render(ctx: CanvasRenderingContext2D, buffer: Uint8Array): void;
}
