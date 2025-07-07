import React from "react";
import PlaybackControls from "./PlaybackControls";
import { PlaybackProvider, usePlayback } from "./PlaybackContext";
import Waveform from "./Waveform";
import { useAppStore } from "../../store/appStore";
// import { selectAudioData } from "../../../store/selectors";
import { decodeAudioFile, getMonoPCMData } from '../../controllers/audioChunker';

export default {
    title: "RefactoredTimeline/PlaybackControls",
};

export const Basic = () => (
    <PlaybackProvider totalDuration={15}>
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

// Helper to downsample PCM data
function downsamplePCM(pcm: Float32Array, numPoints: number): number[] {
    const len = pcm.length;
    const result = [];
    for (let i = 0; i < numPoints; i++) {
        const start = Math.floor((i / numPoints) * len);
        const end = Math.floor(((i + 1) / numPoints) * len);
        let min = 1, max = -1;
        for (let j = start; j < end; j++) {
            const v = pcm[j] || 0;
            if (v < min) min = v;
            if (v > max) max = v;
        }
        result.push((min + max) / 2);
    }
    return result;
}

export const WithAudioUpload = () => {
    const [audioFile, setAudioFile] = React.useState<File | null>(null);
    const setAudioData = useAppStore((s) => s.setAudioData);

    // Inline component to use usePlayback within PlaybackProvider
    const Inner = () => {
        const { setAudioBuffer } = usePlayback();
        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] || null;
            setAudioFile(file);
            if (file) {
                const audioBuffer = await decodeAudioFile(file);
                setAudioBuffer(audioBuffer); // Store in PlaybackProvider for real playback
                const pcm = getMonoPCMData(audioBuffer);
                const waveform = downsamplePCM(pcm, 1000); // 1000 points for fast rendering
                setAudioData({
                    waveform,
                    duration: audioBuffer.duration,
                });
            }
        };
        return (
            <>
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
            </>
        );
    };

    return (
            <PlaybackProvider totalDuration={15}>
                <Inner />
            </PlaybackProvider>
    );
};

// Helper to consume waveform data from Zustand
const WaveformWithStore = (props: { width: number; height: number }) => {
    const waveform = useAppStore(state => state.audio.analysis.waveform);
    if (!Array.isArray(waveform) || waveform.length === 0) return null;
    return <Waveform waveform={waveform} width={props.width} height={props.height} />;
};
