import React, { useState } from "react";
import { Stage, Layer } from "react-konva";
import { ResponseRect } from "./ResponseRect";
import { Card } from "@blueprintjs/core";
import { PaletteStateEditor } from "./PaletteStateEditor";

export default {
  title: "Timeline/ResponseRectGallery",
  component: ResponseRect,
};

const rectWidth = 120;
const rectHeight = 32;
const gap = 32;
const columns = 5;

// Color manipulation helpers
function hexToHSL(hex: string) {
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
function hslToHex(h: number, s: number, l: number) {
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
function shiftHue(hex: string, degree: number) {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex((h + degree) % 360, s, l);
}
function shiftLightness(hex: string, delta: number) {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + delta)));
}

function RectPaletteStatePreviewTool({
  label,
  color,
  borderColor,
  stateProps,
  hue,
  setHue,
  borderHue,
  setBorderHue,
  opacity,
  setOpacity,
  showSliders,
}: {
  label: string;
  color: string;
  borderColor: string;
  stateProps: Record<string, unknown>;
  hue?: number;
  setHue?: (h: number) => void;
  borderHue?: number;
  setBorderHue?: (h: number) => void;
  opacity?: number;
  setOpacity?: (o: number) => void;
  showSliders?: boolean;
}) {
  return (
    <Card style={{ background: '#181c22', padding: 12, borderRadius: 10, boxShadow: '0 2px 8px #0004', margin: 4 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Stage width={rectWidth} height={rectHeight + 8} style={{ background: "none" }}>
          <Layer>
            <ResponseRect
              x={0}
              y={4}
              width={rectWidth}
              height={rectHeight}
              color={color}
              borderColor={borderColor}
              opacity={opacity}
              {...stateProps}
            />
          </Layer>
        </Stage>
        <div style={{ color: "#fff", fontSize: 15, marginTop: 6, textAlign: "center" }}>{label}</div>
        {showSliders ? (
          <PaletteStateEditor
            label={label}
            hue={hue ?? 0}
            setHue={setHue!}
            borderHue={borderHue ?? 0}
            setBorderHue={setBorderHue!}
            opacity={opacity ?? 1}
            setOpacity={setOpacity!}
            color={color}
            borderColor={borderColor}
          />
        ) : (
          <div style={{ height: 8 }} />
        )}
      </div>
    </Card>
  );
}

function PaletteSection({
  title,
  defaultBase,
  borderBase,
}: {
  title: string;
  defaultBase: string;
  borderBase: string;
}) {
  const [baseColor, setBaseColor] = useState(defaultBase);
  const [borderColor, setBorderColor] = useState(borderBase);
  // Hue shift state for each rect state
  const [hueHovered, setHueHovered] = useState(30);
  const [hueSelected, setHueSelected] = useState(-30);
  const [hueActive, setHueActive] = useState(60);
  const [hueUnassigned, setHueUnassigned] = useState(-60);
  const [borderHueHovered, setBorderHueHovered] = useState(20);
  const [borderHueSelected, setBorderHueSelected] = useState(-20);
  const [borderHueActive, setBorderHueActive] = useState(40);
  const [borderHueUnassigned, setBorderHueUnassigned] = useState(-40);
  const [opacityHovered, setOpacityHovered] = useState(1);
  const [opacitySelected, setOpacitySelected] = useState(1);
  const [opacityActive, setOpacityActive] = useState(1);
  const [opacityUnassigned, setOpacityUnassigned] = useState(0.4);

  // Dump palette to console
  function dumpPalette() {
    const palette = {
      baseColor,
      borderColor,
      states: {
        hovered: {
          color: shiftHue(baseColor, hueHovered * 0.3),
          borderColor: shiftHue(borderColor, borderHueHovered * 0.3),
          hue: hueHovered,
          borderHue: borderHueHovered,
          opacity: opacityHovered,
        },
        selected: {
          color: shiftHue(baseColor, hueSelected * 0.3),
          borderColor: shiftHue(borderColor, borderHueSelected * 0.3),
          hue: hueSelected,
          borderHue: borderHueSelected,
          opacity: opacitySelected,
        },
        active: {
          color: shiftHue(baseColor, hueActive * 0.3),
          borderColor: shiftHue(borderColor, borderHueActive * 0.3),
          hue: hueActive,
          borderHue: borderHueActive,
          opacity: opacityActive,
        },
        unassigned: {
          color: shiftHue(baseColor, hueUnassigned * 0.3),
          borderColor: shiftHue(borderColor, borderHueUnassigned * 0.3),
          hue: hueUnassigned,
          borderHue: borderHueUnassigned,
          opacity: opacityUnassigned,
        },
      },
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(palette, null, 2));
  }

  // Generate palette dynamically with dramatic hue/opacity controls
  const palette = [
    {
      label: "Default",
      color: baseColor,
      borderColor: borderColor,
      stateProps: {},
      showSliders: false,
    },
    {
      label: "Hovered",
      color: shiftHue(baseColor, hueHovered * 1.2),
      borderColor: shiftLightness(borderColor, borderHueHovered),
      stateProps: { hovered: true },
      hue: hueHovered,
      setHue: setHueHovered,
      borderHue: borderHueHovered,
      setBorderHue: setBorderHueHovered,
      opacity: opacityHovered,
      setOpacity: setOpacityHovered,
      showSliders: true,
    },
    {
      label: "Selected",
      color: shiftHue(baseColor, hueSelected * 1.2),
      borderColor: shiftLightness(borderColor, borderHueSelected),
      stateProps: { selected: true },
      hue: hueSelected,
      setHue: setHueSelected,
      borderHue: borderHueSelected,
      setBorderHue: setBorderHueSelected,
      opacity: opacitySelected,
      setOpacity: setOpacitySelected,
      showSliders: true,
    },
    {
      label: "Active",
      color: shiftHue(baseColor, hueActive * 1.2),
      borderColor: shiftLightness(borderColor, borderHueActive),
      stateProps: {},
      hue: hueActive,
      setHue: setHueActive,
      borderHue: borderHueActive,
      setBorderHue: setBorderHueActive,
      opacity: opacityActive,
      setOpacity: setOpacityActive,
      showSliders: true,
    },
    {
      label: "Unassigned",
      color: shiftHue(baseColor, hueUnassigned * 1.2),
      borderColor: shiftLightness(borderColor, borderHueUnassigned),
      stateProps: { opacity: opacityUnassigned },
      hue: hueUnassigned,
      setHue: setHueUnassigned,
      borderHue: borderHueUnassigned,
      setBorderHue: setBorderHueUnassigned,
      opacity: opacityUnassigned,
      setOpacity: setOpacityUnassigned,
      showSliders: true,
    },
  ];
  return (
    <div style={{ marginBottom: 40 }}>
      <h3 style={{ color: '#fff', margin: '16px 0 8px 0', fontWeight: 600 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 16 }}>
        <label style={{ color: '#fff', marginRight: 8 }}>Base color:</label>
        <input
          type="color"
          value={baseColor}
          onChange={e => setBaseColor(e.target.value)}
          style={{ marginRight: 16 }}
        />
        <label style={{ color: '#fff', marginRight: 8 }}>Border:</label>
        <input
          type="color"
          value={borderColor}
          onChange={e => setBorderColor(e.target.value)}
          style={{ marginRight: 24 }}
        />
        <button
          onClick={dumpPalette}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 12px',
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 8,
            boxShadow: '0 1px 4px #0003',
          }}
        >
          Dump Palette
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
          justifyItems: "center",
          alignItems: "start",
        }}
      >
        {palette.map((state) => (
          <RectPaletteStatePreviewTool key={state.label} {...state} />
        ))}
      </div>
    </div>
  );
}

export const Gallery = () => (
  <div style={{ background: "#222", padding: 32, borderRadius: 12, minWidth: 400, maxWidth: 1200 }}>
    <PaletteSection title="Single Fire Patterns" defaultBase="#2196f3" borderBase="#fff" />
    <PaletteSection title="Background Wave Players" defaultBase="#4fc3f7" borderBase="#01579b" />
  </div>
); 