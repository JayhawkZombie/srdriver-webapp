import React from 'react';
import CompactMUIControls from './CompactMUIControls';
import CompactBlueprintJSControls from './CompactBlueprintJSControls';

const TestHarnessContent: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'flex-start', padding: 32, background: '#181818', minHeight: '100vh' }}>
      <CompactMUIControls />
      <CompactBlueprintJSControls />
    </div>
  );
};

export default TestHarnessContent; 