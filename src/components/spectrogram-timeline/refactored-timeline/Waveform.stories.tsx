import React from "react";
import Waveform from "./Waveform";

export default {
  title: "RefactoredTimeline/Waveform",
};

// Sine wave data
const sineData = Array.from({ length: 256 }, (_, i) => Math.sin((i / 256) * 4 * Math.PI));
// Random noise data
const noiseData = Array.from({ length: 256 }, () => Math.random() * 2 - 1);

export const Sine = () => (
  <div>
    <div style={{ marginBottom: 8 }}>Without peak trace:</div>
    <Waveform data={sineData} width={400} height={80} />
    <div style={{ margin: '16px 0 8px' }}>With peak trace:</div>
    <Waveform data={sineData} width={400} height={80} showPeakTrace />
  </div>
);

export const Noise = () => (
  <div>
    <div style={{ marginBottom: 8 }}>Without peak trace:</div>
    <Waveform data={noiseData} width={400} height={80} />
    <div style={{ margin: '16px 0 8px' }}>With peak trace:</div>
    <Waveform data={noiseData} width={400} height={80} showPeakTrace />
  </div>
); 