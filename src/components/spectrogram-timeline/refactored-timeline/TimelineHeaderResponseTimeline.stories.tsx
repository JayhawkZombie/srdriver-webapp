import React from "react";
import TimelineHeader from "./TimelineHeader";
import ResponseTimeline from "./ResponseTimeline";
import { PlaybackProvider } from "./PlaybackContext";
import { FakeAppStateStoryProvider } from "../../../store/FakeAppStateStoryProvider";
import { usePlaybackAutoAdvance } from "../../../hooks/usePlaybackAutoAdvance";
import { DeviceControllerProvider } from "../../../controllers/DeviceControllerContext";
import { FakeDeviceControllerProvider } from "../../../stories/FakeDeviceControllerProvider";

export default {
    title: "RefactoredTimeline/TimelineHeader + ResponseTimeline",
};

export const WithFakeAudioData = () => {
    return (
        <FakeDeviceControllerProvider>  
                <FakeAppStateStoryProvider mockType="screenshotBar">
                    <PlaybackProvider totalDuration={15}>
                        <PlaybackAutoAdvanceEnabler />
                        <div
                            style={{
                                width: "100%",
                                maxWidth: 900,
                                margin: "0 auto",
                                background: "#181818",
                                padding: 24,
                                minHeight: 320,
                            }}
                        >
                            <TimelineHeader />
                            <div style={{ height: 24 }} />
                            <ResponseTimeline />
                        </div>
                    </PlaybackProvider>
                </FakeAppStateStoryProvider>
        </FakeDeviceControllerProvider>
    );
};

export const UnifiedDemo = () => (
    <FakeDeviceControllerProvider>
        <FakeAppStateStoryProvider mockType="screenshotBar">
            <PlaybackProvider totalDuration={15}>
                <PlaybackAutoAdvanceEnabler />
                <div
                    style={{
                        width: "100%",
                        maxWidth: 900,
                        margin: "0 auto",
                        background: "#181818",
                        padding: 24,
                        minHeight: 320,
                    }}
                >
                    <TimelineHeader />
                    {/* <div style={{ height: 24 }} /> */}
                    <ResponseTimeline />
                </div>
            </PlaybackProvider>
        </FakeAppStateStoryProvider>
    </FakeDeviceControllerProvider>
);

function PlaybackAutoAdvanceEnabler() {
    usePlaybackAutoAdvance(true);
    return null;
}
