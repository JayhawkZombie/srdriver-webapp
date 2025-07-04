import React from "react";
import { Menu, MenuItem } from "@blueprintjs/core";
import { createPortal } from "react-dom";

export interface TimelineMenuAction {
  key: string;
  text: string;
  icon?: string;
  onClick: (info: any) => void;
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
}

const TimelineContextMenu: React.FC<TimelineContextMenuProps> = ({ isOpen, position, info, onClose, menuRef, actions }) => {
  if (isOpen) {
    console.log('[TimelineContextMenu] Rendering at', position, 'with info', info);
  }
  if (!isOpen || !position) return null;
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
        }}
      >
        <Menu>
          <MenuItem text={`Timestamp: ${info?.timestamp !== undefined ? info.timestamp.toFixed(2) : ''}`} disabled />
          <MenuItem text={`Track: ${info?.trackIndex}`} disabled />
          {info?.responseId && <MenuItem text={`Response ID: ${info.responseId}`} disabled />}
          {info?.timestamp !== undefined && (
            <MenuItem text={`Start: ${info.timestamp.toFixed(2)}`} disabled />
          )}
          {info?.duration !== undefined && info?.timestamp !== undefined && (
            <MenuItem text={`End: ${(info.timestamp + info.duration).toFixed(2)}`} disabled />
          )}
          <MenuItem text="Actions">
            {actions?.map(action =>
              !action.hidden && (
                <MenuItem
                  key={action.key}
                  text={action.text}
                  icon={action.icon as any}
                  disabled={action.disabled}
                  onClick={() => action.onClick(info)}
                >
                  {action.submenu && action.submenu.map(sub => (
                    <MenuItem
                      key={sub.key}
                      text={sub.text}
                      icon={sub.icon as any}
                      disabled={sub.disabled}
                      onClick={() => sub.onClick(info)}
                    />
                  ))}
                </MenuItem>
              )
            )}
          </MenuItem>
          <MenuItem text="Close" icon="cross" onClick={onClose} />
        </Menu>
      </div>
    </>,
    document.body
  );
};

export default TimelineContextMenu; 