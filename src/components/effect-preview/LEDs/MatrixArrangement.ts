import type { ILEDArrangement } from "./LEDArrangement";
import type { LayoutDimensions } from "./types";
import {
  BYTES_PER_LED,
  fillImageDataWithColor,
  parseBackgroundColor,
} from "./types";

/**
 * 2D grid of LEDs (row-major, 3 bytes per LED: R, G, B).
 * Lamps are lampSize × lampSize with gap pixels between them (e.g. 1cm lamp, 1cm gap → total 64cm for 32 lamps).
 */
export class MatrixArrangement implements ILEDArrangement {
  readonly layout: LayoutDimensions;
  readonly numLeds: number;
  readonly width: number;
  readonly height: number;
  private readonly bg: [number, number, number];

  constructor(
    public readonly rows: number,
    public readonly cols: number,
    /** Size of each LED in pixels. */
    public readonly lampSize: number,
    /** Space between lamps in pixels (default 0 = no gap). */
    public readonly gap: number = 0,
    /** Background color (space between LEDs), e.g. "#1a1a2e". */
    backgroundColor: string = "#000000"
  ) {
    this.numLeds = rows * cols;
    this.layout = { type: "matrix", rows, cols };
    const pitch = lampSize + gap;
    this.width = cols * pitch - gap;
    this.height = rows * pitch - gap;
    this.bg = parseBackgroundColor(backgroundColor);
  }

  render(ctx: CanvasRenderingContext2D, buffer: Uint8Array): void {
    const { rows, cols, lampSize, gap, width, height, bg } = this;
    const pitch = lampSize + gap;
    const imageData = ctx.createImageData(width, height);
    fillImageDataWithColor(imageData.data, bg[0], bg[1], bg[2]);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * BYTES_PER_LED;
        const px = c * pitch;
        const py = r * pitch;
        for (let dy = 0; dy < lampSize; dy++) {
          for (let dx = 0; dx < lampSize; dx++) {
            const outX = px + dx;
            const outY = py + dy;
            if (outX < width && outY < height) {
              const out = (outY * width + outX) * 4;
              imageData.data[out] = buffer[i];
              imageData.data[out + 1] = buffer[i + 1];
              imageData.data[out + 2] = buffer[i + 2];
              imageData.data[out + 3] = 255;
            }
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
}
