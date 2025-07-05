export type PaletteState = {
  color: string;
  borderColor: string;
  hue: number;
  borderHue: number;
  opacity: number;
};

export type ResponseRectPalette = {
  baseColor: string;
  borderColor: string;
  states: {
    hovered: PaletteState;
    selected: PaletteState;
    active: PaletteState;
    unassigned: PaletteState;
  };
}; 