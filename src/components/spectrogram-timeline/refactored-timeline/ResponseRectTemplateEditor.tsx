import React, { useState } from 'react';
import { Button, InputGroup, FormGroup, NumericInput, Popover, Position, Card } from '@blueprintjs/core';
import type { RectTemplate } from '../../../store/appStore';
import { useAppStore } from '../../../store/appStore';
import { ResponsePaletteEditor } from './ResponsePaletteEditor';
import { Stage, Layer } from 'react-konva';
import { ResponseRect } from './ResponseRect';

export interface ResponseRectTemplateEditorProps {
  template: RectTemplate;
  onSave: (template: RectTemplate) => void;
}

export const ResponseRectTemplateEditor: React.FC<ResponseRectTemplateEditorProps> = ({ template, onSave }) => {
  const palettes = useAppStore(state => state.palettes);
  const paletteNames = Object.keys(palettes);

  const [local, setLocal] = useState<RectTemplate>({ ...template, defaultData: { ...template.defaultData } });
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showPaletteEditor, setShowPaletteEditor] = useState(false);

  const handleChange = <K extends keyof RectTemplate>(field: K, value: RectTemplate[K]) => {
    setLocal(l => ({ ...l, [field]: value }));
  };

  const handleDataChange = (key: string, value: string) => {
    setLocal(l => ({ ...l, defaultData: { ...l.defaultData, [key]: value } }));
  };

  const handleRemoveDataKey = (key: string) => {
    setLocal(l => {
      const rest = { ...l.defaultData };
      delete rest[key];
      return { ...l, defaultData: rest };
    });
  };

  const handleAddDataKey = () => {
    if (!newKey) return;
    setLocal(l => ({ ...l, defaultData: { ...l.defaultData, [newKey]: newValue } }));
    setNewKey('');
    setNewValue('');
  };

  // Palette popover logic
  const handlePaletteSelect = (paletteName: string) => {
    setLocal(l => ({ ...l, paletteName }));
  };

  // When a new palette is created, select it
  const handlePaletteCreated = (newName: string) => {
    setLocal(l => ({ ...l, paletteName: newName }));
    setShowPaletteEditor(false);
  };

  // Small rect preview size
  const rectWidth = 48;
  const rectHeight = 16;

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 16 }}>
      <FormGroup label="ID">
        <InputGroup value={local.id} onChange={e => handleChange('id', e.target.value)} />
      </FormGroup>
      <FormGroup label="Name">
        <InputGroup value={local.name} onChange={e => handleChange('name', e.target.value)} />
      </FormGroup>
      <FormGroup label="Type">
        <InputGroup value={local.type} onChange={e => handleChange('type', e.target.value)} />
      </FormGroup>
      <FormGroup label="Default Duration">
        <NumericInput min={0} value={local.defaultDuration} onValueChange={v => handleChange('defaultDuration', v)} />
      </FormGroup>
      <FormGroup label="Palette">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500 }}>{local.paletteName}</span>
          <Popover
            position={Position.RIGHT}
            content={
              <div style={{ minWidth: 260, maxWidth: 320, padding: 8 }}>
                <Button
                  icon="add"
                  minimal
                  intent="primary"
                  style={{ marginBottom: 8, width: '100%' }}
                  onClick={() => { setShowPaletteEditor(true); }}
                >
                  Create New Palette
                </Button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {paletteNames.map(name => (
                    <Card
                      key={name}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, margin: 0, boxShadow: 'none', background: '#181c22', cursor: 'pointer' }}
                      onClick={() => handlePaletteSelect(name)}
                      interactive
                    >
                      <Stage width={rectWidth} height={rectHeight} style={{ background: 'none' }}>
                        <Layer>
                          <ResponseRect
                            x={0}
                            y={0}
                            width={rectWidth}
                            height={rectHeight}
                            color={palettes[name].baseColor}
                            borderColor={palettes[name].borderColor}
                          />
                        </Layer>
                      </Stage>
                      <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>{name}</span>
                      {local.paletteName === name && (
                        <Button icon="tick" minimal intent="success" style={{ marginLeft: 'auto' }} />
                      )}
                    </Card>
                  ))}
                </div>
                <Popover
                  isOpen={showPaletteEditor}
                  onClose={() => setShowPaletteEditor(false)}
                  position={Position.RIGHT}
                  content={
                    <div style={{ minWidth: 420, maxWidth: 600 }}>
                      <ResponsePaletteEditor
                        onPaletteCreated={handlePaletteCreated}
                        autoFocusNewPalette
                      />
                    </div>
                  }
                >
                  {/* Hidden trigger, open via Create New Palette button above */}
                  <span />
                </Popover>
              </div>
            }
          >
            <Button icon="chevron-right" minimal />
          </Popover>
          <Popover
            position={Position.RIGHT}
            content={
                <ResponsePaletteEditor />
            }
          >
            <Button icon="edit" minimal title="Edit selected palette" />
          </Popover>
        </div>
      </FormGroup>
      <FormGroup label="Default Data">
        {Object.entries(local.defaultData).map(([key, value]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <InputGroup value={key} disabled style={{ width: 100, marginRight: 8 }} />
            <InputGroup value={String(value)} onChange={e => handleDataChange(key, e.target.value)} style={{ width: 120, marginRight: 8 }} />
            <Button icon="cross" minimal intent="danger" onClick={() => handleRemoveDataKey(key)} />
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
          <InputGroup placeholder="Key" value={newKey} onChange={e => setNewKey(e.target.value)} style={{ width: 100, marginRight: 8 }} />
          <InputGroup placeholder="Value" value={newValue} onChange={e => setNewValue(e.target.value)} style={{ width: 120, marginRight: 8 }} />
          <Button icon="plus" minimal intent="primary" onClick={handleAddDataKey} disabled={!newKey} />
        </div>
      </FormGroup>
      <Button intent="primary" onClick={() => onSave(local)} style={{ marginTop: 16, width: '100%' }}>Save</Button>
    </div>
  );
};

export default ResponseRectTemplateEditor; 