import type { ResponseRectPalette } from "../types/ResponseRectPalette";

export const responseRectPalettes: Record<string, ResponseRectPalette> = {
  led: {
    baseColor: "#2196f3",
    borderColor: "#fff",
    states: {
      hovered: {
        color: "#42a5f5",
        borderColor: "#e3f2fd",
        hue: 10,
        borderHue: 5,
        opacity: 1,
      },
      selected: {
        color: "#f06292",
        borderColor: "#f8bbd0",
        hue: 20,
        borderHue: 10,
        opacity: 1,
      },
      active: {
        color: "#ffd600",
        borderColor: "#fffde7",
        hue: 30,
        borderHue: 15,
        opacity: 1,
      },
      unassigned: {
        color: "#263238",
        borderColor: "#90a4ae",
        hue: 0,
        borderHue: 0,
        opacity: 0.4,
      },
    },
  },
  network: {
    baseColor: "#4fc3f7",
    borderColor: "#01579b",
    states: {
      hovered: {
        color: "#81d4fa",
        borderColor: "#0288d1",
        hue: 10,
        borderHue: 5,
        opacity: 1,
      },
      selected: {
        color: "#ba68c8",
        borderColor: "#ede7f6",
        hue: 20,
        borderHue: 10,
        opacity: 1,
      },
      active: {
        color: "#ffd600",
        borderColor: "#fffde7",
        hue: 30,
        borderHue: 15,
        opacity: 1,
      },
      unassigned: {
        color: "#263238",
        borderColor: "#90a4ae",
        hue: 0,
        borderHue: 0,
        opacity: 0.4,
      },
    },
  },
}; 