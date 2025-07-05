import React from "react";
import { Icon } from "@blueprintjs/core";
import SliderControl from "./SliderControl";
import { Stage, Layer } from "react-konva";
import { ResponseRect } from "./ResponseRect";

export interface PaletteStateEditorProps {
  label: string;
  hue: number;
  setHue: (h: number) => void;
  borderHue: number;
  setBorderHue: (h: number) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  color: string;
  borderColor: string;
}

export const PaletteStateEditor: React.FC<PaletteStateEditorProps> = ({
  label,
  hue,
  setHue,
  borderHue,
  setBorderHue,
  opacity,
  setOpacity,
  color,
  borderColor,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120, alignItems: 'center' }}>
    <Stage width={120} height={40} style={{ background: 'none' }}>
      <Layer>
        <ResponseRect
          x={0}
          y={4}
          width={120}
          height={32}
          color={color}
          borderColor={borderColor}
          opacity={opacity}
        />
      </Layer>
    </Stage>
    <div style={{ color: "#fff", fontSize: 14, marginBottom: 4 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Icon icon="tint" intent="primary" style={{ marginRight: 2 }} />
      <SliderControl min={-100} max={100} step={1} value={hue} onChange={setHue} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Icon icon="box" intent="primary" style={{ marginRight: 2 }} />
      <SliderControl min={-100} max={100} step={1} value={borderHue} onChange={setBorderHue} />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Icon icon="contrast" intent="primary" style={{ marginRight: 2 }} />
      <SliderControl min={0} max={1} step={0.01} value={opacity} onChange={setOpacity} />
    </div>
  </div>
); 