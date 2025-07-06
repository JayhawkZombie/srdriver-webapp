import React, { useState } from 'react';
import { Button } from '@blueprintjs/core';
import { AppStateLogDrawer } from './AppStateLogDrawer';

export default {
  title: 'RefactoredTimeline/AppStateLogDrawer',
  component: AppStateLogDrawer,
};

export const Default = () => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <Button icon="console" onClick={() => setIsOpen(true)}>
        Open Log Drawer
      </Button>
      <AppStateLogDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}; 