import React, { useState } from 'react';
import { Button, InputGroup, NumericInput, Popover, Position, Card, Collapse } from '@blueprintjs/core';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Stage, Layer } from 'react-konva';
import { ResponseRect } from './ResponseRect';
import { ResponsePaletteEditor } from './ResponsePaletteEditor';
import type { RectTemplate } from '../../../store/appStore';
import { useAppStore } from '../../../store/appStore';

// Extend RectTemplate locally to allow tags and notes
type RectTemplateWithMeta = RectTemplate & { tags?: string[]; notes?: string };

export interface ResponseRectTemplateEditorProps {
  template: RectTemplateWithMeta;
  onSave: (template: RectTemplateWithMeta) => void;
}

const typeOptions = [
  { value: 'pulse', label: 'Pulse' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'cue', label: 'Cue' },
  { value: 'settings', label: 'Settings Change' },
  { value: 'led', label: 'LED' },
];

export const ResponseRectTemplateEditor: React.FC<ResponseRectTemplateEditorProps> = ({ template, onSave }) => {
  const palettes = useAppStore(state => state.palettes);
  const [local, setLocal] = useState<RectTemplateWithMeta>({ ...template, defaultData: { ...template.defaultData } });
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Helper: tags as array
  const tags: string[] = (local.tags as string[]) || [];

  // Palette preview size
  const rectWidth = 48;
  const rectHeight = 16;

  // Handlers
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
  const handlePaletteCreated = (newName: string) => {
    setLocal(l => ({ ...l, paletteName: newName }));
  };
  const handleTagAdd = () => {
    if (!tagInput.trim()) return;
    setLocal(l => ({ ...l, tags: [...tags, tagInput.trim()] }));
    setTagInput('');
  };
  const handleTagDelete = (tag: string) => {
    setLocal(l => ({ ...l, tags: tags.filter((t: string) => t !== tag) }));
  };

  return (
    <Card style={{ maxWidth: 420, margin: '0 auto', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
      {/* Header: Name, Type, Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <TextField
          value={local.name}
          onChange={e => handleChange('name', e.target.value)}
          variant="standard"
          size="small"
          placeholder="Template Name"
          InputProps={{ disableUnderline: true, style: { fontWeight: 600, fontSize: 18, minWidth: 120 } }}
          sx={{ flex: 1, mr: 1, background: 'none' }}
        />
        <Select
          value={local.type}
          onChange={e => handleChange('type', e.target.value as string)}
          size="small"
          variant="standard"
          sx={{ minWidth: 90, fontSize: 14 }}
        >
          {typeOptions.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      </div>
      {/* Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {tags.map((tag: string) => (
          <Chip key={tag} label={tag} size="small" onDelete={() => handleTagDelete(tag)} style={{ marginRight: 2 }} />
        ))}
        <TextField
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleTagAdd(); }}
          placeholder="Add tag"
          size="small"
          variant="standard"
          sx={{ width: 60 }}
        />
        <IconButton size="small" onClick={handleTagAdd}><span className="bp5-icon bp5-icon-plus" /></IconButton>
      </div>
      {/* Palette & Preview Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>Palette:</span>
        <Popover
          position={Position.RIGHT}
          content={
            <ResponsePaletteEditor
              onPaletteCreated={handlePaletteCreated}
              autoFocusNewPalette
            />
          }
        >
          <Button minimal style={{ padding: 0, marginRight: 4 }}>
            <Stage width={rectWidth} height={rectHeight} style={{ background: 'none', borderRadius: 4 }}>
              <Layer>
                <ResponseRect
                  x={0}
                  y={0}
                  width={rectWidth}
                  height={rectHeight}
                  color={palettes[local.paletteName]?.baseColor || '#eee'}
                  borderColor={palettes[local.paletteName]?.borderColor || '#ccc'}
                />
              </Layer>
            </Stage>
          </Button>
        </Popover>
        <span style={{ fontWeight: 500, fontSize: 14 }}>{local.paletteName}</span>
        <Popover
          position={Position.RIGHT}
          content={<ResponsePaletteEditor />}
        >
          <Button icon="edit" minimal small style={{ marginLeft: 2 }} />
        </Popover>
        {/* Live Preview (placeholder) */}
        <div style={{ marginLeft: 'auto', marginRight: 8 }}>
          <Stage width={rectWidth} height={rectHeight} style={{ background: 'none', borderRadius: 4 }}>
            <Layer>
              <ResponseRect
                x={0}
                y={0}
                width={rectWidth}
                height={rectHeight}
                color={palettes[local.paletteName]?.baseColor || '#eee'}
                borderColor={palettes[local.paletteName]?.borderColor || '#ccc'}
              />
            </Layer>
          </Stage>
        </div>
        {/* Device/Track Assignment (placeholder) */}
        {/* <Select ... /> */}
      </div>
      {/* Main Fields: Duration, Default Data */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 90 }}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>Duration:</span>
          <NumericInput min={0} value={local.defaultDuration} onValueChange={v => handleChange('defaultDuration', v)} style={{ width: 70, marginLeft: 6 }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>Default Data:</span>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 24px', gap: 4, marginTop: 2 }}>
            {Object.entries(local.defaultData).map(([key, value]) => (
              <React.Fragment key={key}>
                <InputGroup value={key} disabled style={{ width: 90 }} />
                <InputGroup value={String(value)} onChange={e => handleDataChange(key, e.target.value)} style={{ width: '100%' }} />
                <IconButton size="small" onClick={() => handleRemoveDataKey(key)}><span className="bp5-icon bp5-icon-cross" /></IconButton>
              </React.Fragment>
            ))}
            <InputGroup placeholder="Key" value={newKey} onChange={e => setNewKey(e.target.value)} style={{ width: 90 }} />
            <InputGroup placeholder="Value" value={newValue} onChange={e => setNewValue(e.target.value)} style={{ width: '100%' }} />
            <IconButton size="small" onClick={handleAddDataKey} disabled={!newKey}><span className="bp5-icon bp5-icon-plus" /></IconButton>
          </div>
        </div>
      </div>
      {/* Advanced/Notes (Collapsible) */}
      <div style={{ marginBottom: 10 }}>
        <Button minimal small icon={showNotes ? 'chevron-down' : 'chevron-right'} onClick={() => setShowNotes(n => !n)} style={{ fontSize: 12, padding: 0 }}>
          Notes / Description
        </Button>
        <Collapse isOpen={showNotes} keepChildrenMounted>
          <TextField
            value={typeof local.notes === 'string' ? local.notes : ''}
            onChange={e => setLocal(l => ({ ...l, notes: e.target.value }))}
            placeholder="Add notes or cues for this template..."
            multiline
            minRows={2}
            maxRows={4}
            size="small"
            sx={{ width: '100%', mt: 1 }}
          />
        </Collapse>
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <Tooltip content="Duplicate" title="Duplicate">
          <Button icon="duplicate" minimal small onClick={() => onSave({ ...local, id: local.id + '-copy' })} />
        </Tooltip>
        <Tooltip content="Delete" title="Delete">
          <Button icon="trash" minimal small intent="danger" onClick={() => {/* handle delete */}} />
        </Tooltip>
        <Tooltip content="Preview" title="Preview">
          <Button icon="eye-open" minimal small />
        </Tooltip>
        <Button intent="primary" onClick={() => onSave(local)} style={{ minWidth: 80 }}>Save</Button>
      </div>
    </Card>
  );
};

export default ResponseRectTemplateEditor; 