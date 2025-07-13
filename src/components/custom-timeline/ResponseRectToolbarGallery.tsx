import React, { useState, useRef, useContext } from 'react';
import { useAppStore } from '../../store/appStore';
import type { RectTemplate } from '../../store/appStore';
import { Stage, Layer } from 'react-konva';
import { ResponseRect } from './ResponseRect';
import Typography from '@mui/material/Typography';
import { Button, InputGroup, Popover, Position } from '@blueprintjs/core';
import { ResponseRectTemplateEditor } from './ResponseRectTemplateEditor';
import { UnifiedThemeContext } from '../../context/UnifiedThemeContext';

const rectWidth = 40;
const rectHeight = 14;

function generateId() {
  return Math.random().toString(36).slice(2) + '-' + Date.now();
}

export const ResponseRectToolbarGallery: React.FC = () => {
  const rectTemplates = useAppStore(state => state.rectTemplates);
  const palettes = useAppStore(state => state.palettes);
  const addRectTemplate = useAppStore(state => state.addRectTemplate);
  const updateRectTemplate = useAppStore(state => state.updateRectTemplate);
  const { mode } = useContext(UnifiedThemeContext) ?? { mode: 'light' };

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Focus input when prompt opens
  React.useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const paletteName = Object.keys(palettes)[0] || 'default';
    addRectTemplate({
      id: generateId(),
      name: newName.trim(),
      type: 'led',
      defaultDuration: 1,
      defaultData: {},
      paletteName,
    });
    setNewName('');
    setCreating(false);
  };

  const handleSaveTemplate = (template: RectTemplate & { tags?: string[]; notes?: string }) => {
    // If the template has a "-copy" suffix, it's a new template
    if (template.id.endsWith('-copy')) {
      const newId = generateId();
      addRectTemplate({
        ...template,
        id: newId,
      });
    } else {
      // Update existing template
      updateRectTemplate(template.id, template);
    }
    // Close the popover after saving
    setOpenPopover(null);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
      <Typography
        variant="h6"
        style={{
          fontWeight: 600,
          fontSize: 17,
          marginBottom: 8,
          fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace',
          textAlign: 'center',
        }}
      >
        Response Template Gallery
      </Typography>
      <Button
        icon="add"
        intent="primary"
        minimal
        style={{ marginBottom: 4, fontSize: 15, fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace', color: '#2178d6' }}
        onClick={() => setCreating(v => !v)}
      >
        {creating ? 'Cancel' : 'Create New Template'}
      </Button>
      {creating && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            margin: '4px 0 8px 0',
            border: '1px solid #2c313a',
            borderRadius: 6,
            padding: '4px 8px',
            background: 'rgba(30,34,40,0.95)',
          }}
        >
          <InputGroup
            inputRef={inputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New template name"
            style={{
              padding: 3,
              borderRadius: 4,
              background: 'none',
              color: '#eee',
              minWidth: 90,
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace',
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            autoFocus
            fill={false}
            small
          />
          <Button
            icon="floppy-disk"
            intent="success"
            small
            onClick={handleCreate}
            disabled={!newName.trim()}
            style={{ fontSize: 12, padding: '2px 6px', fontFamily: 'JetBrains Mono, Fira Mono, Menlo, monospace' }}
          >
            Save
          </Button>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
          gap: 8,
          padding: 8,
          width: '100%',
          maxWidth: 340,
          justifyContent: 'center',
          justifyItems: 'center',
        }}
      >
        {Object.values(rectTemplates).map(t => {
          const palette = palettes[t.paletteName] || palettes[Object.keys(palettes)[0]];
          const isOpen = openPopover === t.id;
          return (
            <Popover
              key={t.id}
              isOpen={isOpen}
              onInteraction={nextOpen => setOpenPopover(nextOpen ? t.id : null)}
              position={Position.RIGHT}
              usePortal={true}
              content={
                <div className={mode === 'dark' ? 'bp5-dark' : ''} style={{ background: mode === 'dark' ? '#181c22' : 'var(--bp5-card-background-color, #fff)', borderRadius: 10, minWidth: 340 }}>
                  <ResponseRectTemplateEditor template={t} onSave={handleSaveTemplate} />
                </div>
              }
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bp5-card-background-color, #23272f)',
                  border: '1.5px solid #23272f',
                  borderRadius: 7,
                  padding: 4,
                  minWidth: 64,
                  maxWidth: 110,
                  boxShadow: '0 1px 4px #0002',
                  overflow: 'hidden',
                  position: 'relative',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <Stage width={rectWidth} height={rectHeight} style={{ background: 'none', marginBottom: 2 }}>
                    <Layer>
                      <ResponseRect
                        x={0}
                        y={0}
                        width={rectWidth}
                        height={rectHeight}
                        color={palette.baseColor}
                        borderColor={palette.borderColor}
                        opacity={1}
                      />
                    </Layer>
                  </Stage>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--bp5-text-color, #e6eaf3)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 80,
                      marginTop: 2,
                    }}
                    title={t.name}
                  >
                    {t.name}
                  </div>
                </div>
                <Button
                  icon={isOpen ? 'chevron-down' : 'chevron-right'}
                  minimal
                  small
                  style={{ marginLeft: 2, zIndex: 2 }}
                  onClick={e => {
                    e.stopPropagation();
                    setOpenPopover(isOpen ? null : t.id);
                  }}
                  aria-label={isOpen ? 'Collapse editor' : 'Expand editor'}
                />
              </div>
            </Popover>
          );
        })}
      </div>
    </div>
  );
}; 