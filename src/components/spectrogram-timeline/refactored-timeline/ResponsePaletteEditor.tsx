import React, { useState } from "react";
import { useAppStore } from "../../../store/appStore";
import { Card, Button, Popover, Position } from "@blueprintjs/core";
import { Stage, Layer } from "react-konva";
import { ResponseRect } from "./ResponseRect";
import { PaletteStateEditor } from "./PaletteStateEditor";

// Color helpers (copy from gallery)
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

const rectWidth = 120;
const rectHeight = 32;

export const ResponsePaletteEditor: React.FC = () => {
  const palettes = useAppStore(state => state.palettes);
  const setPalette = useAppStore(state => state.setPalette);
  const [popoverOpen, setPopoverOpen] = useState<{ [key: string]: boolean }>({});
  const [editingName, setEditingName] = useState<{ [key: string]: string }>({});

  // Rename palette key in app store
  const handleRename = (oldName: string, newName: string) => {
    if (!newName || newName === oldName) return;
    const pal = palettes[oldName];
    const newPalettes = { ...palettes };
    delete newPalettes[oldName];
    newPalettes[newName] = pal;
    // Save all palettes at once
    Object.entries(newPalettes).forEach(([k, v]) => setPalette(k, v));
    setEditingName(editing => ({ ...editing, [newName]: newName }));
  };

  // Local state for popover editing (per palette)
  const [localEdits, setLocalEdits] = useState<{ [key: string]: any }>({});
  const handlePaletteEdit = (paletteName: string, newPal: any) => {
    setLocalEdits(prev => ({ ...prev, [paletteName]: newPal }));
  };
  const handleSave = (paletteName: string) => {
    setPalette(paletteName, localEdits[paletteName]);
    setPopoverOpen(open => ({ ...open, [paletteName]: false }));
  };

  return (
    <div style={{ background: "#222", padding: 32, borderRadius: 12, minWidth: 400, maxWidth: 1200 }}>
      <h3 style={{ color: '#fff', margin: '16px 0 24px 0', fontWeight: 600 }}>Response Palette Editor</h3>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(3, 1fr)`, gap: 32, justifyItems: "center", alignItems: "start" }}>
        {Object.entries(palettes).map(([paletteName, pal]) => {
          const nickname = editingName[paletteName] ?? paletteName;
          const localPal = localEdits[paletteName] ?? pal;
          return (
            <Card key={paletteName} style={{ background: '#181c22', padding: 16, borderRadius: 10, boxShadow: '0 2px 8px #0004', margin: 4, minWidth: 220, position: 'relative' }}>
              {/* Chevron in top right */}
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <Popover
                  isOpen={!!popoverOpen[paletteName]}
                  onInteraction={nextOpen => setPopoverOpen(open => ({ ...open, [paletteName]: nextOpen }))}
                  position={Position.BOTTOM_RIGHT}
                  content={
                    <div style={{ background: '#222', padding: 16, borderRadius: 8, minWidth: 380 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 16 }}>
                        <label style={{ color: '#fff', fontSize: 14, marginRight: 8 }}>Base color:</label>
                        <input
                          type="color"
                          value={localPal.baseColor}
                          onChange={e => handlePaletteEdit(paletteName, { ...localPal, baseColor: e.target.value })}
                          style={{ width: 36, height: 28, border: 'none', borderRadius: 4, background: 'none' }}
                        />
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                          <Stage width={rectWidth} height={rectHeight + 8} style={{ background: 'none' }}>
                            <Layer>
                              <ResponseRect
                                x={0}
                                y={4}
                                width={rectWidth}
                                height={rectHeight}
                                color={localPal.baseColor}
                                borderColor={localPal.borderColor}
                              />
                            </Layer>
                          </Stage>
                          <Button intent="primary" style={{ marginLeft: 12 }} onClick={() => handleSave(paletteName)}>
                            Save
                          </Button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {Object.entries(localPal.states).map(([stateKey, state]) => {
                          const s = state as { hue: number; borderHue: number; opacity: number };
                          const previewColor = shiftHue(localPal.baseColor, s.hue * 1.2);
                          const previewBorder = shiftLightness(localPal.borderColor, s.borderHue);
                          return (
                            <PaletteStateEditor
                              key={stateKey}
                              label={stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}
                              hue={s.hue}
                              setHue={hue => handlePaletteEdit(paletteName, {
                                ...localPal,
                                states: {
                                  ...localPal.states,
                                  [stateKey]: { ...localPal.states[stateKey], hue },
                                },
                              })}
                              borderHue={s.borderHue}
                              setBorderHue={borderHue => handlePaletteEdit(paletteName, {
                                ...localPal,
                                states: {
                                  ...localPal.states,
                                  [stateKey]: { ...localPal.states[stateKey], borderHue },
                                },
                              })}
                              opacity={s.opacity}
                              setOpacity={opacity => handlePaletteEdit(paletteName, {
                                ...localPal,
                                states: {
                                  ...localPal.states,
                                  [stateKey]: { ...localPal.states[stateKey], opacity },
                                },
                              })}
                              color={previewColor}
                              borderColor={previewBorder}
                            />
                          );
                        })}
                      </div>
                    </div>
                  }
                >
                  <Button icon="chevron-down" minimal small style={{ color: '#fff' }} />
                </Popover>
              </div>
              {/* Palette name centered at top */}
              <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 4 }}>
                <input
                  value={nickname}
                  onChange={e => setEditingName(editing => ({ ...editing, [paletteName]: e.target.value }))}
                  onBlur={e => handleRename(paletteName, e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: '1.5px solid #444',
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 600,
                    textAlign: 'center',
                    outline: 'none',
                    width: 120,
                  }}
                />
              </div>
              {/* Rect preview centered below name */}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                <Stage width={rectWidth} height={rectHeight + 8} style={{ background: "none" }}>
                  <Layer>
                    <ResponseRect
                      x={0}
                      y={4}
                      width={rectWidth}
                      height={rectHeight}
                      color={pal.baseColor}
                      borderColor={pal.borderColor}
                    />
                  </Layer>
                </Stage>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 