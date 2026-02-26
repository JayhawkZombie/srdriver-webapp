import type { ILEDArrangement } from "./LEDArrangement";
import type { LayoutDimensions } from "./types";
import {
  BYTES_PER_LED,
  fillImageDataWithColor,
  parseBackgroundColor,
} from "./types";

export type StripOrientation = "row" | "column";

/**
 * 1D strip of LEDs with even spacing. Lamps are lampSize with gap between them.
 */
export class StripArrangement implements ILEDArrangement {
  readonly layout: LayoutDimensions;
  readonly numLeds: number;
  readonly width: number;
  readonly height: number;
  private readonly bg: [number, number, number];

  constructor(
    public readonly length: number,
    /** Size of each LED in pixels. */
    public readonly lampSize: number,
    /** Space between lamps in pixels (default 0). */
    public readonly gap: number = 0,
    public readonly orientation: StripOrientation = "row",
    /** Background color (space between LEDs), e.g. "#1a1a2e". */
    backgroundColor: string = "#000000"
  ) {
    this.numLeds = length;
    this.layout = { type: "strip", length };
    this.bg = parseBackgroundColor(backgroundColor);
    const pitch = lampSize + gap;
    const total = length * pitch - gap;
    if (orientation === "row") {
      this.width = total;
      this.height = lampSize;
    } else {
      this.width = lampSize;
      this.height = total;
    }
  }

  render(ctx: CanvasRenderingContext2D, buffer: Uint8Array): void {
    const { length, lampSize, gap, width, height, orientation, bg } = this;
    const pitch = lampSize + gap;
    const imageData = ctx.createImageData(width, height);
    fillImageDataWithColor(imageData.data, bg[0], bg[1], bg[2]);
    for (let i = 0; i < length; i++) {
      const base = i * BYTES_PER_LED;
      const r = buffer[base];
      const g = buffer[base + 1];
      const b = buffer[base + 2];
      const px = orientation === "row" ? i * pitch : 0;
      const py = orientation === "row" ? 0 : i * pitch;
      for (let dy = 0; dy < lampSize; dy++) {
        for (let dx = 0; dx < lampSize; dx++) {
          const outX = px + dx;
          const outY = py + dy;
          if (outX < width && outY < height) {
            const out = (outY * width + outX) * 4;
            imageData.data[out] = r;
            imageData.data[out + 1] = g;
            imageData.data[out + 2] = b;
            imageData.data[out + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
}
