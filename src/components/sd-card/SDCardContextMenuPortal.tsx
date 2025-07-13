import React from 'react';
import { Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import type { SDCardContextMenuAction } from './SDCardContextMenuAction';

function renderMenuActions(actions: SDCardContextMenuAction[]) {
  return actions.map((action, i) =>
    action.divider ? (
      <MenuDivider key={i} />
    ) : (
      <MenuItem
        key={action.label}
        text={action.label}
        icon={action.icon}
        intent={action.intent}
        disabled={action.disabled}
        onClick={action.onClick}
      >
        {action.children && renderMenuActions(action.children)}
      </MenuItem>
    )
  );
}

// NOTE: For Storybook, use absolute positioning so the menu appears inside the preview iframe.
// In the real app, you can switch back to 'fixed' or use a true portal.
export const SDCardContextMenuPortal: React.FC<{
  x: number;
  y: number;
  actions: SDCardContextMenuAction[];
  onClose: () => void;
}> = ({ x, y, actions, onClose }) => (
  <div
    style={{
      position: 'absolute', // was 'fixed'
      top: y,
      left: x,
      zIndex: 9999,
      background: '#222',
      borderRadius: 4,
      border: '1px solid #444',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}
    onClick={onClose}
    onContextMenu={e => e.preventDefault()}
  >
    <Menu>{renderMenuActions(actions)}</Menu>
  </div>
); 