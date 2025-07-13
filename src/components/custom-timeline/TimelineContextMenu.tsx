import React from "react";
import { Menu, MenuItem, InputGroup } from "@blueprintjs/core";
import { createPortal } from "react-dom";

export interface TimelineMenuAction {
  key: string;
  text: string;
  icon?: string;
  onClick?: (info: any) => void;
  disabled?: boolean;
  hidden?: boolean;
  submenu?: TimelineMenuAction[];
}

interface TimelineContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  info: any;
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
  actions?: TimelineMenuAction[];
  onEditRectData?: (rectId: string, key: string, value: any) => void;
  onDeleteRect?: (rectId: string) => void;
}

function renderMenuActions(actions: TimelineMenuAction[] = [], info: any) {
  return actions.map(action =>
    !action.hidden && (
      <MenuItem
        key={action.key}
        text={action.text}
        icon={action.icon as any}
        disabled={action.disabled}
        onClick={action.submenu ? undefined : () => action.onClick && action.onClick(info)}
      >
        {action.submenu && renderMenuActions(action.submenu, info)}
      </MenuItem>
    )
  );
}

const TimelineContextMenu: React.FC<TimelineContextMenuProps> = ({ isOpen, position, info, onClose, menuRef, actions, onEditRectData, onDeleteRect }) => {
  if (!isOpen || !position) return null;
  // List of keys to skip (disabled fields)
  const disabledKeys = ["timestamp", "duration", "trackIndex"];
  return createPortal(
    <>
      <div style={{position:'fixed',top:0,left:0,zIndex:10000,background:'#f00',color:'#fff',padding:4,fontSize:12}}>MENU OPEN (debug)</div>
      <div
        ref={menuRef}
        className="bp5-menu"
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 9999,
          minWidth: 220,
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          background: "#23272f",
          borderRadius: 6,
          padding: 0,
          color: '#fff',
        }}
      >
        <Menu>
          {info?.type === 'rect' ? (
            <>
              <MenuItem text={`Timestamp: ${info.rect.timestamp !== undefined ? info.rect.timestamp.toFixed(2) : ''}`} disabled />
              <MenuItem text={`Duration: ${info.rect.duration !== undefined ? info.rect.duration.toFixed(2) : ''}`} disabled />
              <MenuItem text={`Track: ${info.rect.trackIndex}`} disabled />
              {/* Editable fields for rect.data */}
              {info.rect.data && Object.keys(info.rect.data).filter(key => !disabledKeys.includes(key)).map(key => (
                <MenuItem key={key} text={
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{minWidth: 80, color: '#aaa'}}>{key}:</span>
                    <InputGroup
                      value={String(info.rect.data[key] ?? '')}
                      onChange={e => onEditRectData && onEditRectData(info.rect.id, key, e.target.value)}
                      style={{flex:1,minWidth:60}}
                      fill
                      small
                    />
                  </div>
                } />
              ))}
              <MenuItem
                text="Delete"
                icon="trash"
                intent="danger"
                onClick={() => {
                  if (onDeleteRect) onDeleteRect(info.rect.id);
                  onClose();
                }}
              />
            </>
          ) : info?.type === 'background' ? (
            <>
              <MenuItem text={`Timestamp: ${info.timestamp !== undefined ? info.timestamp.toFixed(2) : ''}`} disabled />
              <MenuItem text={`Track: ${info.trackIndex}`} disabled />
            </>
          ) : null}
          {actions && renderMenuActions(actions, info)}
          <MenuItem text="Close" icon="cross" onClick={onClose} />
        </Menu>
      </div>
    </>,
    document.body
  );
};

export default TimelineContextMenu; 