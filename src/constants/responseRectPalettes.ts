import type { ResponseRectPalette } from "../types/ResponseRectPalette";

export const responseRectPalettes: Record<string, ResponseRectPalette> = {
  lightPulse: {
    baseColor: "#00e676",
    borderColor: "#fff",
    states: {
      hovered: { color: "", borderColor: "", hue: 30, borderHue: 20, opacity: 1 },
      selected: { color: "", borderColor: "", hue: -30, borderHue: -20, opacity: 1 },
      active: { color: "", borderColor: "", hue: 60, borderHue: 40, opacity: 1 },
      unassigned: { color: "", borderColor: "", hue: -60, borderHue: -40, opacity: 0.4 },
    },
  },
  singleFirePattern: {
    baseColor: "#2196f3",
    borderColor: "#fff",
    states: {
      hovered: { color: "", borderColor: "", hue: 30, borderHue: 20, opacity: 1 },
      selected: { color: "", borderColor: "", hue: -30, borderHue: -20, opacity: 1 },
      active: { color: "", borderColor: "", hue: 60, borderHue: 40, opacity: 1 },
      unassigned: { color: "", borderColor: "", hue: -60, borderHue: -40, opacity: 0.4 },
    },
  },
  oneOffCue: {
    baseColor: "#ffd600",
    borderColor: "#fff",
    states: {
      hovered: { color: "", borderColor: "", hue: 30, borderHue: 20, opacity: 1 },
      selected: { color: "", borderColor: "", hue: -30, borderHue: -20, opacity: 1 },
      active: { color: "", borderColor: "", hue: 60, borderHue: 40, opacity: 1 },
      unassigned: { color: "", borderColor: "", hue: -60, borderHue: -40, opacity: 0.4 },
    },
  },
  changeSettings: {
    baseColor: "#ff4081",
    borderColor: "#fff",
    states: {
      hovered: { color: "", borderColor: "", hue: 30, borderHue: 20, opacity: 1 },
      selected: { color: "", borderColor: "", hue: -30, borderHue: -20, opacity: 1 },
      active: { color: "", borderColor: "", hue: 60, borderHue: 40, opacity: 1 },
      unassigned: { color: "", borderColor: "", hue: -60, borderHue: -40, opacity: 0.4 },
    },
  },
}; 