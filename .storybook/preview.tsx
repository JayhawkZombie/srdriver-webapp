import React from 'react';
import { AppStateLogDrawer } from '../src/components/spectrogram-timeline/refactored-timeline/AppStateLogDrawer';
import { FakeAppStateStoryProvider } from '../src/store/FakeAppStateStoryProvider';
import { FakeDeviceControllerProvider } from '../src/stories/FakeDeviceControllerProvider';
import "@blueprintjs/core/lib/css/blueprint.css";

export const globalTypes = {
  showLogDrawer: {
    name: 'Log Drawer',
    description: 'Show the application log drawer',
    defaultValue: false,
    toolbar: {
      icon: 'sidebar',
      items: [
        { value: true, title: 'Show Log Drawer' },
        { value: false, title: 'Hide Log Drawer' },
      ],
    },
  },
  initialGlobals: {
    showLogDrawer: false,
  }
};

export const decorators = [
  (Story, context) => {
    const showLogDrawer = context.globals.showLogDrawer;
    return (
        <FakeDeviceControllerProvider>
            <FakeAppStateStoryProvider mockType="screenshotBar">
                <AppStateLogDrawer
                    isOpen={!!showLogDrawer}
                    onClose={() => {}}
                />
                <Story />
            </FakeAppStateStoryProvider>
        </FakeDeviceControllerProvider>
    );
  },
];

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
  a11y: {
    test: 'todo',
  },
};