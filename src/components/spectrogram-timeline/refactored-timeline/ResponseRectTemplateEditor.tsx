import React, { useState, useContext } from 'react';
import { Button, NumericInput, Popover, Position, Card, Collapse } from '@blueprintjs/core';
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
import { useAppStore, selectTemplateTypes, useAddTemplateType, useUpdateTemplateType, useRemoveTemplateType } from '../../../store/appStore';
import EditableKeyValueTree from '../../utility/EditableKeyValueTree';
import { UnifiedThemeContext } from '../../../context/UnifiedThemeContext';

// Extend RectTemplate locally to allow tags and notes
type RectTemplateWithMeta = RectTemplate & { tags?: string[]; notes?: string };

export interface ResponseRectTemplateEditorProps {
  template: RectTemplateWithMeta;
  onSave: (template: RectTemplateWithMeta) => void;
}

export const ResponseRectTemplateEditor: React.FC<ResponseRectTemplateEditorProps> = ({ template, onSave }) => {
  const palettes = useAppStore(state => state.palettes);
  const templateTypes = useAppStore(selectTemplateTypes);
  const addTemplateType = useAddTemplateType();
  const updateTemplateType = useUpdateTemplateType();
  const removeTemplateType = useRemoveTemplateType();
  const [local, setLocal] = useState<RectTemplateWithMeta>({ ...template, defaultData: { ...template.defaultData } });
  const [showNotes, setShowNotes] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [addingType, setAddingType] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeValue, setNewTypeValue] = useState('');
  const [editTypeValue, setEditTypeValue] = useState<string | null>(null);
  const [editTypeLabel, setEditTypeLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [userData, setUserData] = useState<Record<string, unknown>>({});
  const [showUserAdd, setShowUserAdd] = useState(false);
  const [userKey, setUserKey] = useState('');
  const [userValue, setUserValue] = useState('');
  const { mode } = useContext(UnifiedThemeContext) ?? { mode: 'light' };

  // Helper: tags as array
  const tags: string[] = (local.tags as string[]) || [];

  // Palette preview size
  const rectWidth = 48;
  const rectHeight = 16;

  // Lock the first two keys (pattern, color) for key editing
  const keys = Object.keys(local.defaultData);
  const lockMeta = keys.reduce((acc, key, idx) => {
    acc[key] = { lockKey: idx < 2, lockValue: false };
    return acc;
  }, {} as Record<string, { lockKey: boolean; lockValue: boolean }>);

  // Handlers
  const handleChange = <K extends keyof RectTemplate>(field: K, value: RectTemplate[K]) => {
    setLocal(l => ({ ...l, [field]: value }));
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
  const handleAddKeyValue = () => {
    if (!newKey.trim() || newKey in local.defaultData) return;
    setLocal(l => ({ ...l, defaultData: { ...l.defaultData, [newKey]: newValue } }));
    setNewKey('');
    setNewValue('');
  };
  const handleAddUserKeyValue = () => {
    if (!userKey.trim() || userKey in userData) return;
    setUserData(u => ({ ...u, [userKey]: userValue }));
    setUserKey('');
    setUserValue('');
    setShowUserAdd(false);
  };

  // Helper to get the label for the current type
  const typeLabel = templateTypes.find(t => t.value === local.type)?.label || local.type;

  return (
    <div className={mode === 'dark' ? 'bp5-dark' : ''} style={{ background: mode === 'dark' ? '#181c22' : 'var(--bp5-card-background-color, #fff)', borderRadius: 12 }}>
      <Card
        style={{
          maxWidth: 420,
          margin: '0 auto',
          padding: 16,
          borderRadius: 12,
          boxShadow: '0 2px 8px #0001',
          background: mode === 'dark' ? '#23272f' : 'var(--bp5-card-background-color, #fff)',
          color: mode === 'dark' ? '#e6eaf3' : undefined,
          border: mode === 'dark' ? '1.5px solid #23272f' : undefined,
        }}
      >
        {/* Header: Dynamic Type + Name, Type Dropdown, Tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <h2
            style={{
              fontWeight: 600,
              fontSize: 20,
              flex: 1,
              margin: 0,
              padding: 0,
              lineHeight: 1.2,
            }}
          >
            {typeLabel}
            {local.name ? `: ${local.name}` : ""}
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 120,
            }}
          >
            <Select
              value={local.type}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setAddingType(true);
                  setNewTypeLabel("");
                  setNewTypeValue("");
                } else {
                  handleChange("type", e.target.value as string);
                }
              }}
              size="small"
              variant="standard"
              sx={{ minWidth: 90, fontSize: 14 }}
            >
              {templateTypes.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {editTypeValue === opt.value ? (
                      <>
                        <TextField
                          value={editTypeLabel}
                          onChange={(e) =>
                            setEditTypeLabel(
                              e.target.value
                            )
                          }
                          size="small"
                          variant="standard"
                          sx={{ width: 80, fontSize: 14 }}
                          onBlur={() => {
                            updateTemplateType(
                              opt.value,
                              { label: editTypeLabel }
                            );
                            setEditTypeValue(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateTemplateType(
                                opt.value,
                                {
                                  label: editTypeLabel,
                                }
                              );
                              setEditTypeValue(null);
                            }
                          }}
                          autoFocus
                        />
                        <IconButton
                          size="small"
                          onClick={() =>
                            setEditTypeValue(null)
                          }
                        >
                          <span className="bp5-icon bp5-icon-cross" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <span>{opt.label}</span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTypeValue(opt.value);
                            setEditTypeLabel(opt.label);
                          }}
                          style={{
                            marginLeft: 2,
                            padding: 2,
                          }}
                        >
                          <span className="bp5-icon bp5-icon-edit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTemplateType(opt.value);
                          }}
                          style={{
                            marginLeft: 2,
                            padding: 2,
                          }}
                        >
                          <span className="bp5-icon bp5-icon-trash" />
                        </IconButton>
                      </>
                    )}
                  </span>
                </MenuItem>
              ))}
              <MenuItem
                key="__new__"
                value="__new__"
                style={{ fontStyle: "italic", color: "#137cbd" }}
              >
                + New Type…
              </MenuItem>
            </Select>
            {addingType && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <TextField
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  size="small"
                  variant="standard"
                  placeholder="Type label"
                  sx={{ width: 80, fontSize: 14 }}
                />
                <TextField
                  value={newTypeValue}
                  onChange={(e) => setNewTypeValue(e.target.value)}
                  size="small"
                  variant="standard"
                  placeholder="Type value"
                  sx={{ width: 60, fontSize: 14 }}
                />
                <Button
                  small
                  intent="primary"
                  disabled={
                    !newTypeLabel ||
                    !newTypeValue ||
                    templateTypes.some(
                      (t) => t.value === newTypeValue
                    )
                  }
                  onClick={() => {
                    addTemplateType({
                      value: newTypeValue,
                      label: newTypeLabel,
                    });
                    setAddingType(false);
                    setNewTypeLabel("");
                    setNewTypeValue("");
                    handleChange("type", newTypeValue);
                  }}
                >
                  Add
                </Button>
                <Button
                  small
                  minimal
                  onClick={() => setAddingType(false)}
                >
                  <span className="bp5-icon bp5-icon-cross" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          {tags.map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onDelete={() => handleTagDelete(tag)}
              style={{ marginRight: 2 }}
            />
          ))}
          <TextField
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTagAdd();
            }}
            placeholder="Add tag"
            size="small"
            variant="standard"
            sx={{ width: 60 }}
          />
          <IconButton size="small" onClick={handleTagAdd}>
            <span className="bp5-icon bp5-icon-plus" />
          </IconButton>
        </div>
        {/* Palette & Preview Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
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
              <Stage
                width={rectWidth}
                height={rectHeight}
                style={{ background: "none", borderRadius: 4 }}
              >
                <Layer>
                  <ResponseRect
                    x={0}
                    y={0}
                    width={rectWidth}
                    height={rectHeight}
                    color={
                      palettes[local.paletteName]?.baseColor ||
                      "#eee"
                    }
                    borderColor={
                      palettes[local.paletteName]
                        ?.borderColor || "#ccc"
                    }
                  />
                </Layer>
              </Stage>
            </Button>
          </Popover>
          <span style={{ fontWeight: 500, fontSize: 14 }}>
            {local.paletteName}
          </span>
          <Popover
            position={Position.RIGHT}
            content={<ResponsePaletteEditor />}
          >
            <Button icon="edit" minimal small style={{ marginLeft: 2 }} />
          </Popover>
          {/* Live Preview (placeholder) */}
          <div style={{ marginLeft: "auto", marginRight: 8 }}>
            <Stage
              width={rectWidth}
              height={rectHeight}
              style={{ background: "none", borderRadius: 4 }}
            >
              <Layer>
                <ResponseRect
                  x={0}
                  y={0}
                  width={rectWidth}
                  height={rectHeight}
                  color={
                    palettes[local.paletteName]?.baseColor ||
                    "#eee"
                  }
                  borderColor={
                    palettes[local.paletteName]?.borderColor ||
                    "#ccc"
                  }
                />
              </Layer>
            </Stage>
          </div>
          {/* Device/Track Assignment (placeholder) */}
          {/* <Select ... /> */}
        </div>
        {/* Main Fields: Duration, Default Data */}
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <div style={{ minWidth: 90 }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>
              Duration:
            </span>
            <NumericInput
              min={0}
              value={local.defaultDuration}
              onValueChange={(v) => handleChange("defaultDuration", v)}
              style={{ width: 70, marginLeft: 6 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>
              Default Data:
            </span>
            <EditableKeyValueTree
              data={local.defaultData}
              editable={true}
              lockMeta={lockMeta}
              onDataChange={newObj => setLocal(l => ({ ...l, defaultData: newObj as Record<string, unknown> }))}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="text"
                placeholder="New key"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 13, padding: 2, borderRadius: 4, border: '1px solid #ccc', width: 90 }}
              />
              <input
                type="text"
                placeholder="New value"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 13, padding: 2, borderRadius: 4, border: '1px solid #ccc', width: 90 }}
              />
              <Button small intent="primary" onClick={handleAddKeyValue} disabled={!newKey.trim() || newKey in local.defaultData}>
                Add
              </Button>
            </div>
            {/* User Data Section */}
            <div style={{ borderTop: '1px solid #eee', margin: '18px 0 0 0', paddingTop: 12 }}>
              <span style={{ fontWeight: 500, fontSize: 13, color: '#888' }}>User Data:</span>
              <EditableKeyValueTree
                data={userData}
                editable={true}
                onDataChange={(newData: unknown) => setUserData(newData as Record<string, unknown>)}
              />
              {!showUserAdd ? (
                <Button
                  small
                  minimal
                  icon="add"
                  style={{
                    marginTop: 8,
                    color: mode === 'dark' ? '#b8d4ff' : undefined,
                    fontWeight: 500,
                  }}
                  onClick={() => setShowUserAdd(true)}
                >
                  Add user property
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="User key"
                    value={userKey}
                    onChange={e => setUserKey(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 13, padding: 2, borderRadius: 4, border: '1px solid #ccc', width: 90 }}
                  />
                  <input
                    type="text"
                    placeholder="User value"
                    value={userValue}
                    onChange={e => setUserValue(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 13, padding: 2, borderRadius: 4, border: '1px solid #ccc', width: 90 }}
                  />
                  <Button small intent="primary" onClick={handleAddUserKeyValue} disabled={!userKey.trim() || userKey in userData}>
                    Add
                  </Button>
                  <Button small minimal icon="cross" onClick={() => { setShowUserAdd(false); setUserKey(''); setUserValue(''); }} />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Advanced/Notes (Collapsible) */}
        <div style={{ marginBottom: 10 }}>
          <Button
            minimal
            small
            icon={showNotes ? "chevron-down" : "chevron-right"}
            onClick={() => setShowNotes((n) => !n)}
            style={{ fontSize: 12, padding: 0 }}
          >
            Notes / Description
          </Button>
          <Collapse isOpen={showNotes} keepChildrenMounted>
            <TextField
              value={typeof local.notes === "string" ? local.notes : ""}
              onChange={(e) =>
                setLocal((l) => ({ ...l, notes: e.target.value }))
              }
              placeholder="Add notes or cues for this template..."
              multiline
              minRows={2}
              maxRows={4}
              size="small"
              sx={{ width: "100%", mt: 1 }}
            />
          </Collapse>
        </div>
        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <Tooltip content="Duplicate" title="Duplicate">
            <Button
              icon="duplicate"
              minimal
              small
              onClick={() =>
                onSave({ ...local, id: local.id + "-copy" })
              }
            />
          </Tooltip>
          <Tooltip content="Delete" title="Delete">
            <Button
              icon="trash"
              minimal
              small
              intent="danger"
              onClick={() => {
                /* handle delete */
              }}
            />
          </Tooltip>
          <Tooltip content="Preview" title="Preview">
            <Button icon="eye-open" minimal small />
          </Tooltip>
          <Button
            intent="primary"
            onClick={() => onSave(local)}
            style={{ minWidth: 80 }}
          >
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ResponseRectTemplateEditor; 