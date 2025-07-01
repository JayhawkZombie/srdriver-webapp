import React from 'react';
import { Slider, Switch, Button, Card, Elevation, Tabs, Tab, RadioGroup, Radio } from '@blueprintjs/core';
import type { TabId } from '@blueprintjs/core';

const CompactBlueprintJSControls: React.FC = () => {
  const [sliderValue, setSliderValue] = React.useState(30);
  const [sliderValue2, setSliderValue2] = React.useState(60);
  const [toggle, setToggle] = React.useState(false);
  const [toggle2, setToggle2] = React.useState(true);
  const [tabId, setTabId] = React.useState<TabId>('tab1');
  const [radio, setRadio] = React.useState('a');

  const handleTabChange = (newTabId: TabId) => setTabId(newTabId);

  return (
    <Card elevation={Elevation.TWO} style={{ width: 240, padding: 12, background: '#222', color: '#fff' }}>
      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>BlueprintJS Compact Controls</div>
      <Tabs id="TabsExample" selectedTabId={tabId} onChange={handleTabChange} renderActiveTabPanelOnly={true} large={false}>
        <Tab id="tab1" title="Plot A" panel={
          <>
            <div style={{ marginBottom: 8 }}>
              <Slider
                min={0}
                max={100}
                value={sliderValue}
                onChange={setSliderValue}
                labelStepSize={50}
                labelRenderer={false}
                intent="primary"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <Switch
                checked={toggle}
                onChange={() => setToggle(!toggle)}
                labelElement={<span style={{ fontSize: 12 }}>Toggle 1</span>}
                large={false}
              />
            </div>
            <Button small={true} intent="primary">Action</Button>
          </>
        } />
        <Tab id="tab2" title="Plot B" panel={
          <>
            <div style={{ marginBottom: 8 }}>
              <Slider
                min={0}
                max={100}
                value={sliderValue2}
                onChange={setSliderValue2}
                labelStepSize={50}
                labelRenderer={false}
                intent="success"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <Switch
                checked={toggle2}
                onChange={() => setToggle2(!toggle2)}
                labelElement={<span style={{ fontSize: 12 }}>Toggle 2</span>}
                large={false}
              />
            </div>
            <RadioGroup
              label={<span style={{ fontSize: 12 }}>Select Option</span>}
              onChange={e => setRadio((e.target as HTMLInputElement).value)}
              selectedValue={radio}
              inline={true}
              style={{ color: '#fff', fontSize: 12 }}
            >
              <Radio label="A" value="a" />
              <Radio label="B" value="b" />
            </RadioGroup>
          </>
        } />
      </Tabs>
    </Card>
  );
};

export default CompactBlueprintJSControls; 