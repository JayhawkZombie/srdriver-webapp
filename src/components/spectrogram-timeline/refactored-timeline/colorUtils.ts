// Color utilities for palette-driven rects

export function hexToHSL(hex: string) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function shiftHue(hex: string, degree: number) {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex((h + degree) % 360, s, l);
}

export function shiftLightness(hex: string, delta: number) {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + delta)));
}

// Main palette color resolver
export function getPaletteColor({
  baseColor,
  borderColor,
  state,
}: {
  baseColor: string;
  borderColor: string;
  state: { color?: string; borderColor?: string; hue?: number; borderHue?: number; opacity?: number };
}): { color: string; borderColor: string; opacity: number } {
  // If color is set, use it; otherwise, shift baseColor by hue
  let color = state.color && state.color !== '' ? state.color : shiftHue(baseColor, (state.hue ?? 0) * 1.2);
  let border = state.borderColor && state.borderColor !== '' ? state.borderColor : shiftLightness(borderColor, state.borderHue ?? 0);
  let opacity = state.opacity ?? 1;
  return { color, borderColor: border, opacity };
} 