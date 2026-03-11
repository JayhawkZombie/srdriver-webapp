import type { ILEDArrangement } from "./LEDArrangement";
import type { LayoutDimensions } from "./types";
import { BYTES_PER_LED, fillImageDataWithColor, parseBackgroundColor } from "./types";

/**
 * LEDs arranged in a ring (circle). Buffer index 0 is at top (12 o'clock), then counter-clockwise.
 * Center is derived so the ring fits in width/height.
 */
export class RingArrangement implements ILEDArrangement {
	readonly layout: LayoutDimensions;
	readonly numLeds: number;
	readonly width: number;
	readonly height: number;
	private readonly centerX: number;
	private readonly centerY: number;
	private readonly radius: number;
	private readonly lampSize: number;
	private readonly bg: [number, number, number];

	constructor(
		public readonly count: number,
		radius: number,
		/** Size of each LED in pixels. */
		lampSize: number,
		/** Background color (space between/around LEDs), e.g. "#1a1a2e". */
		backgroundColor: string = "#000000"
	) {
		this.numLeds = count;
		this.layout = { type: "ring", count };
		this.radius = radius;
		this.lampSize = lampSize;
		this.bg = parseBackgroundColor(backgroundColor);
		const padding = radius + lampSize / 2;
		this.width = Math.ceil(2 * padding);
		this.height = Math.ceil(2 * padding);
		this.centerX = this.width / 2;
		this.centerY = this.height / 2;
	}

	render(ctx: CanvasRenderingContext2D, buffer: Uint8Array): void {
		const { count, centerX, centerY, radius, lampSize, width, height, bg } = this;
		const imageData = ctx.createImageData(width, height);
		fillImageDataWithColor(imageData.data, bg[0], bg[1], bg[2]);
		const half = lampSize / 2;
		for (let i = 0; i < count; i++) {
			const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
			const x = centerX + radius * Math.cos(angle);
			const y = centerY + radius * Math.sin(angle);
			const px = Math.floor(x - half);
			const py = Math.floor(y - half);
			const base = i * BYTES_PER_LED;
			const r = buffer[base];
			const g = buffer[base + 1];
			const b = buffer[base + 2];
			for (let dy = 0; dy < lampSize; dy++) {
				for (let dx = 0; dx < lampSize; dx++) {
					const outX = px + dx;
					const outY = py + dy;
					if (outX >= 0 && outX < width && outY >= 0 && outY < height) {
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
