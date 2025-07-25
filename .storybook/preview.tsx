import React from "react";
import { AppStateLogDrawer } from "../src/components/dev/AppStateLogDrawer";
import DevAppStateViewer from "../src/components/dev/DevAppStateViewer";
import { FakeAppStateStoryProvider } from "../src/store/FakeAppStateStoryProvider";
import { FakeDeviceControllerProvider } from "../src/stories/FakeDeviceControllerProvider";
import { UnifiedThemeProvider } from "../src/context/UnifiedThemeProvider";
import "@blueprintjs/core/lib/css/blueprint.css";
import { PlaybackProvider } from "../src/components/custom-timeline/PlaybackContext";
import { AudioAnalysisProvider } from "../src/components/custom-timeline/AudioAnalysisContext";
import { DetectionDataProvider } from "../src/components/custom-timeline/DetectionDataContext";

export const globalTypes = {
    showLogDrawer: {
        name: "Log Drawer",
        description: "Show the application log drawer",
        defaultValue: false,
        toolbar: {
            icon: "sidebar",
            items: [
                { value: true, title: "Show Log Drawer" },
                { value: false, title: "Hide Log Drawer" },
            ],
        },
    },
    showDevAppStateDrawer: {
        name: "App State Drawer",
        description: "Show the dev app state viewer drawer",
        defaultValue: false,
        toolbar: {
            icon: "sidebar",
            items: [
                { value: true, title: "Show App State Drawer" },
                { value: false, title: "Hide App State Drawer" },
            ],
        },
    },
};

export const decorators = [
    (Story, context) => {
        const showLogDrawer = context.globals.showLogDrawer;
        const showDevAppStateDrawer = context.globals.showDevAppStateDrawer;
        return (
            <UnifiedThemeProvider>
                <FakeDeviceControllerProvider>
                    <FakeAppStateStoryProvider mockType="screenshotBar">
                        <PlaybackProvider>
                            <AudioAnalysisProvider>
                                <DetectionDataProvider>
                                    <AppStateLogDrawer
                                        isOpen={!!showLogDrawer}
                                        onClose={() => {}}
                                    />
                                    <DevAppStateViewer
                                        isOpen={!!showDevAppStateDrawer}
                                        onClose={() => {}}
                                    />
                                    <Story />
                                </DetectionDataProvider>
                            </AudioAnalysisProvider>
                        </PlaybackProvider>
                    </FakeAppStateStoryProvider>
                </FakeDeviceControllerProvider>
            </UnifiedThemeProvider>
        );
    },
];
