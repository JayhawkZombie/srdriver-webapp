import React from "react";
import PlaybackControls from "./PlaybackControls";
import { PlaybackProvider } from "./PlaybackContext";
import Waveform from "./Waveform";
import { FakeAppStateStoryProvider } from "../../../store/FakeAppStateStoryProvider";
import { useAppStore } from "../../../store/appStore";
import { selectWaveform } from "../../../store/selectors";

export default {
    title: "RefactoredTimeline/PlaybackControls",
};

export const Basic = () => (
    <PlaybackProvider>
        <PlaybackControls>
            <div style={{ color: "#fff", fontSize: 13, marginTop: 4 }}>
                Child content (e.g., spectrogram)
            </div>
            <div style={{ color: "#fff", fontSize: 12, marginTop: 8 }}>
                <strong>Tip:</strong> The{" "}
                <span style={{ fontWeight: "bold" }}>circular arrows</span>{" "}
                button toggles autoplay (auto-advance) for demo/testing.
            </div>
        </PlaybackControls>
    </PlaybackProvider>
);

export const WithAudioUpload = () => {
    const [audioFile, setAudioFile] = React.useState<File | null>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setAudioFile(file);
        if (file) {
            console.log("Uploaded audio file:", file);
        }
    };
    // For now, use the fake provider for demo. Replace with real provider when ready.
    return (
        <FakeAppStateStoryProvider mockType="sine">
            <PlaybackProvider>
                <div style={{ marginBottom: 16 }}>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                    />
                    {audioFile && (
                        <div
                            style={{
                                color: "#fff",
                                fontSize: 13,
                                marginTop: 8,
                            }}
                        >
                            Selected file: <strong>{audioFile.name}</strong>
                        </div>
                    )}
                </div>
                {/* Waveform visualization below upload, above controls */}
                <WaveformWithStore width={400} height={80} />
                <PlaybackControls />
            </PlaybackProvider>
        </FakeAppStateStoryProvider>
    );
};

// Helper to consume waveform data from Zustand
const WaveformWithStore = (props: { width: number; height: number }) => {
    const waveform = useAppStore(selectWaveform);
    if (!Array.isArray(waveform) || waveform.length === 0) return null;
    return <Waveform width={props.width} height={props.height} />;
};
