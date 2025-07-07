import React, { useState, useContext } from "react";
import { useAppStore } from "../../store/appStore";
import { Card, Button, Popover, Position, Menu, MenuItem, Icon, Tooltip } from "@blueprintjs/core";
import { Stage, Layer } from "react-konva";
import { ResponseRect } from "./ResponseRect";
import type { ResponseRectPalette } from '../../types/ResponseRectPalette';
import { shiftHue, shiftBrightness } from './colorUtils';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import { UnifiedThemeContext } from '../../context/UnifiedThemeContext';
import Typography from '@mui/material/Typography';

const rectWidth = 64;
const rectHeight = 20;

interface ResponsePaletteEditorProps {
  onPaletteCreated?: (newName: string) => void;
  autoFocusNewPalette?: boolean;
}

export const ResponsePaletteEditor: React.FC<ResponsePaletteEditorProps> = ({ onPaletteCreated, autoFocusNewPalette }) => {
  const { mode } = useContext(UnifiedThemeContext) ?? { mode: 'light' };
  const palettes = useAppStore(state => state.palettes);
  const setPalette = useAppStore(state => state.setPalette);
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({});
  const [editingName, setEditingName] = useState<{ [key: string]: string }>({});
  const [newPaletteName, setNewPaletteName] = useState('');
  const [creatingPalette, setCreatingPalette] = useState(false);
  const newPaletteInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoFocusNewPalette && creatingPalette && newPaletteInputRef.current) {
      newPaletteInputRef.current.focus();
    }
  }, [autoFocusNewPalette, creatingPalette]);

  const handleCreatePalette = () => {
    if (!newPaletteName || palettes[newPaletteName]) return;
    // Create a default palette structure
    const defaultPalette = {
      baseColor: '#00e676',
      borderColor: '#fff',
      states: {
        hovered: { color: '', borderColor: '', hue: 30, borderHue: 20, opacity: 1 },
        selected: { color: '', borderColor: '', hue: -30, borderHue: -20, opacity: 1 },
        active: { color: '', borderColor: '', hue: 60, borderHue: 40, opacity: 1 },
        unassigned: { color: '', borderColor: '', hue: -60, borderHue: -40, opacity: 0.4 },
      },
    };
    setPalette(newPaletteName, defaultPalette);
    setEditingName(editing => ({ ...editing, [newPaletteName]: newPaletteName }));
    setCreatingPalette(false);
    setNewPaletteName('');
    if (onPaletteCreated) onPaletteCreated(newPaletteName);
  };

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
  const [localEdits, setLocalEdits] = useState<{ [key: string]: ResponseRectPalette }>({});
  const handlePaletteEdit = (paletteName: string, newPal: ResponseRectPalette) => {
    setLocalEdits(prev => ({ ...prev, [paletteName]: newPal }));
  };
  const handleSave = (paletteName: string) => {
    setPalette(paletteName, localEdits[paletteName]);
    setPopoverOpen(open => ({ ...open, [paletteName]: false }));
  };

  return (
    <div
      className={mode === 'dark' ? 'bp5-dark' : ''}
      style={{
        minWidth: 240,
        maxWidth: 320,
        padding: 0,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        boxShadow: 'none',
      }}
    >
      <Typography variant="h6" style={{ fontWeight: 600, fontSize: 17, marginBottom: 4, fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace' }}>
        Response Palette Editor
      </Typography>
      <Button icon="add" intent="primary" minimal style={{ marginBottom: 4, fontSize: 13, padding: '2px 6px', fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace' }} onClick={() => setCreatingPalette(v => !v)}>
        {creatingPalette ? 'Cancel' : 'Create New Palette'}
      </Button>
      {creatingPalette && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '4px 0 8px 0' }}>
          <input
            ref={newPaletteInputRef}
            value={newPaletteName}
            onChange={e => setNewPaletteName(e.target.value)}
            placeholder="New palette name"
            style={{ padding: 3, borderRadius: 4, border: '1px solid #ccc', background: mode === 'dark' ? '#23272f' : '#fff', color: mode === 'dark' ? '#eee' : '#222', minWidth: 80, fontSize: 13, fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace' }}
            onKeyDown={e => { if (e.key === 'Enter') handleCreatePalette(); }}
          />
          <Button icon="floppy-disk" intent="success" small onClick={handleCreatePalette} disabled={!newPaletteName || !!palettes[newPaletteName]} style={{ fontSize: 12, padding: '2px 6px', fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace' }}>
            Save
          </Button>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', alignItems: 'center' }}>
        {Object.entries(palettes).map(([paletteName, pal]) => {
          const popoverKey = `popover_${paletteName}`;
          const nickname = editingName[paletteName] ?? paletteName;
          const localPal = localEdits[paletteName] ?? pal;
          return (
            <Card
              key={paletteName}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8,
                boxShadow: '0 1px 4px #0001',
                background: mode === 'dark' ? '#23272f' : 'var(--bp5-card-background-color, #fff)',
                border: mode === 'dark' ? '1.5px solid #2c313a' : '1px solid var(--bp5-divider-black, #222)',
                minHeight: 28, maxWidth: 260, width: '100%', marginBottom: 3
              }}
              elevation={0}
            >
              <Stage width={rectWidth} height={rectHeight} style={{ background: 'none', marginRight: 8 }}>
                <Layer>
                  <ResponseRect
                    x={0}
                    y={0}
                    width={rectWidth}
                    height={rectHeight}
                    color={pal.baseColor}
                    borderColor={pal.borderColor}
                  />
                </Layer>
              </Stage>
              <TextField
                value={nickname}
                onChange={e => setEditingName(editing => ({ ...editing, [paletteName]: e.target.value }))}
                onBlur={e => handleRename(paletteName, e.target.value)}
                variant="standard"
                size="small"
                InputProps={{ disableUnderline: true, style: { fontWeight: 500, fontSize: 13, width: 90, padding: 0, background: 'none', color: 'var(--bp5-text-color, #eee)', fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace' } }}
                sx={{ minWidth: 0, flex: 1, mr: 1, background: 'none' }}
              />
              <Popover
                isOpen={Boolean(popoverOpen[popoverKey])}
                onInteraction={nextOpen => setPopoverOpen(open => {
                  const filtered = Object.fromEntries(
                    Object.entries(open).filter(([_, value]) => { void _; return typeof value === 'boolean'; })
                  );
                  return { ...filtered, [popoverKey]: typeof nextOpen === 'boolean' ? nextOpen : !!nextOpen };
                })}
                position={Position.RIGHT}
                usePortal={true}
                content={
                  <div
                    className={mode === 'dark' ? 'bp5-dark' : ''}
                    style={{
                      background: mode === 'dark'
                        ? '#181c22'
                        : 'var(--bp5-card-background-color, #fff)',
                      borderRadius: 8,
                      padding: 0,
                      boxShadow: mode === 'dark' ? '0 2px 16px #000b' : '0 2px 16px #0002'
                    }}
                  >
                    <Menu style={{
                      minWidth: 320,
                      maxWidth: 480,
                      background: mode === 'dark' ? '#23272f' : 'var(--bp5-card-background-color, #fff)',
                      boxShadow: 'none',
                      borderRadius: 8,
                      padding: 0
                    }}>
                      <MenuItem text={<span style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, marginRight: 8, fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace' }}>Base color:</span>
                        <input
                          type="color"
                          value={localPal.baseColor}
                          onChange={e => handlePaletteEdit(paletteName, { ...localPal, baseColor: e.target.value })}
                          style={{ width: 36, height: 24, border: 'none', borderRadius: 6, background: 'none', marginRight: 12 }}
                        />
                        <Tooltip content="Save" position="top">
                          <Button icon="floppy-disk" intent="primary" large minimal style={{ padding: '4px 8px' }} onClick={() => handleSave(paletteName)} />
                        </Tooltip>
                      </span>} disabled />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 8 }}>
                        {Object.entries(localPal.states).map(([stateKey, state]) => {
                          type StateKey = keyof typeof localPal.states;
                          const sk = stateKey as StateKey;
                          const s = state as { hue: number; borderHue: number; opacity: number; brightness?: number };
                          const brightness = typeof s.brightness === 'number' ? s.brightness : 0;
                          const previewColor = shiftBrightness(shiftHue(localPal.baseColor, s.hue), brightness);
                          return (
                            <Card key={stateKey} elevation={1} style={{
                              padding: 10,
                              minWidth: 140,
                              maxWidth: 220,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              background: mode === 'dark' ? '#23272f' : 'var(--bp5-card-background-color, #fff)',
                              color: mode === 'dark' ? '#e6eaf3' : undefined,
                              border: mode === 'dark' ? '1.5px solid #23272f' : undefined
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <div style={{ width: 24, height: 12, background: previewColor, border: '1.5px solid #fff', borderRadius: 3 }} />
                                <span style={{ fontWeight: 500, fontSize: 13, color: previewColor }}>{stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                {/* Hue */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Tooltip content="Hue" position="top">
                                    <Icon icon="tint" size={14} style={{ color: '#888' }} />
                                  </Tooltip>
                                  <div style={{ width: 32, margin: 0 }}>
                                    <Slider size="small" min={-180} max={180} step={1} value={s.hue} onChange={(_, hue) => handlePaletteEdit(paletteName, { ...localPal, states: { ...localPal.states, [sk]: { ...localPal.states[sk], hue: hue as number } } })} sx={{ width: 32, minWidth: 0, p: 0 }} />
                                  </div>
                                </div>
                                {/* Border Hue */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Tooltip content="Border Hue" position="top">
                                    <Icon icon="layout" size={14} style={{ color: '#888' }} />
                                  </Tooltip>
                                  <div style={{ width: 32, margin: 0 }}>
                                    <Slider size="small" min={-180} max={180} step={1} value={s.borderHue} onChange={(_, borderHue) => handlePaletteEdit(paletteName, { ...localPal, states: { ...localPal.states, [sk]: { ...localPal.states[sk], borderHue: borderHue as number } } })} sx={{ width: 32, minWidth: 0, p: 0 }} />
                                  </div>
                                </div>
                                {/* Opacity */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Tooltip content="Opacity" position="top">
                                    <Icon icon="eye-open" size={14} style={{ color: '#888' }} />
                                  </Tooltip>
                                  <div style={{ width: 32, margin: 0 }}>
                                    <Slider size="small" min={0} max={1} step={0.01} value={s.opacity} onChange={(_, opacity) => handlePaletteEdit(paletteName, { ...localPal, states: { ...localPal.states, [sk]: { ...localPal.states[sk], opacity: opacity as number } } })} sx={{ width: 32, minWidth: 0, p: 0 }} />
                                  </div>
                                </div>
                                {/* Brightness */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Tooltip content="Brightness" position="top">
                                    <Icon icon="contrast" size={14} style={{ color: '#888' }} />
                                  </Tooltip>
                                  <div style={{ width: 32, margin: 0 }}>
                                    <Slider size="small" min={-50} max={50} step={1} value={brightness} onChange={(_, b) => handlePaletteEdit(paletteName, { ...localPal, states: { ...localPal.states, [sk]: { ...localPal.states[sk], brightness: b as number } } })} sx={{ width: 32, minWidth: 0, p: 0 }} />
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </Menu>
                  </div>
                }
              >
                <Button icon="edit" minimal small style={{ color: '#222', padding: 0, marginLeft: 'auto' }} />
              </Popover>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 