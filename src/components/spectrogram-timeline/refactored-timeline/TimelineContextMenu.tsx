import React from "react";
import { Menu, MenuItem } from "@blueprintjs/core";
import { createPortal } from "react-dom";

interface TimelineContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  info: any;
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
  extraMenuItems?: React.ReactNode;
}

const TimelineContextMenu: React.FC<TimelineContextMenuProps> = ({ isOpen, position, info, onClose, menuRef, extraMenuItems }) => {
  if (!isOpen || !position) return null;
  return createPortal(
    <div
      ref={menuRef}
      className="bp5-menu"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 9999,
        minWidth: 180,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        background: "#23272f",
        borderRadius: 6,
        padding: 0,
      }}
    >
      <Menu>
        <MenuItem text={`Time: ${info?.time?.toFixed(2)}`} disabled />
        <MenuItem text={`Track: ${info?.trackIndex}`} disabled />
        {info?.responseId && <MenuItem text={`Response ID: ${info.responseId}`} disabled />}
        <MenuItem text="Actions">
          <MenuItem text="Add Response" icon="add" />
          <MenuItem text="Delete Track" icon="trash" />
          <MenuItem text="More Actions">
            <MenuItem
              text="Nested Action 1"
              onClick={() => console.log("Nested Action 1 clicked", info)}
            />
            <MenuItem text="Nested Action 2" />
          </MenuItem>
        </MenuItem>
        {extraMenuItems}
        <MenuItem text="Close" icon="cross" onClick={onClose} />
      </Menu>
    </div>,
    document.body
  );
};

export default TimelineContextMenu; 