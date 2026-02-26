/** RGB bytes per LED in the effect buffer. */
export const BYTES_PER_LED = 3;

/** Common shape for layout dimensions (matrix = rows/cols, strip = length, ring = count). */
export type LayoutDimensions =
  | { type: "matrix"; rows: number; cols: number }
  | { type: "strip"; length: number }
  | { type: "ring"; count: number };

/** Parse a CSS-style color to [R, G, B]. Supports #RRGGBB and #RGB. Defaults to black if invalid. */
export function parseBackgroundColor(color: string): [number, number, number] {
  const s = color.trim();
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
  }
  return [0, 0, 0];
}

/** Fill ImageData with a solid RGB color (alpha 255). */
export function fillImageDataWithColor(
  data: Uint8ClampedArray,
  r: number,
  g: number,
  b: number
): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
}
