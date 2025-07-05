import type { AppState } from "./appStore";
import {
  makeSineWave,
  makeNoise,
  makeRandomBarData,
  makeSineBarData,
  makeBeatBarData,
  makeScreenshotLikeBarData,
} from "./mockAudioData";

type WaveformType = 'sine' | 'noise';
type FakeAppStateType = WaveformType | "randomBar" | "sineBar" | "beatBar" | "screenshotBar";

export function getFakeAppState(type: FakeAppStateType = "sine"): AppState {
  // Always populate all waveform types
  const waveforms: Record<WaveformType, number[]> = {
    sine: makeSineWave(256),
    noise: makeNoise(256),
    // Add more waveform types here as needed
  };
  // Set the default waveform to the requested type (for backward compatibility)
  const waveform = waveforms[type as WaveformType] || waveforms.sine;

  let barData;
  switch (type) {
    case "randomBar":
      barData = makeRandomBarData(64);
      break;
    case "sineBar":
      barData = makeSineBarData(64);
      break;
    case "beatBar":
      barData = makeBeatBarData(64);
      break;
    case "screenshotBar":
      barData = makeScreenshotLikeBarData(400);
      break;
    default:
      // No special barData
      break;
  }
  return {
    audio: {
      analysis: {
        waveform, // default/legacy
        waveforms, // all types
        barData,
        duration: 4,
        fftSequence: [],
        summary: null,
      },
      data: { metadata: null, analysis: null },
    },
    playback: {
      currentTime: 0,
      isPlaying: false,
      totalDuration: 4,
    },
    ui: {
      windowSec: 4,
      showFirstDerivative: false,
      showSecondDerivative: false,
      showImpulses: true,
      showSustainedImpulses: false,
      onlySustained: false,
      showDetectionFunction: false,
    },
    timeline: {
      responses: [],
    },
    devices: [],
    deviceMetadata: {},
    deviceState: {},
    deviceConnection: {},
    deviceData: {},
    deviceUserPrefs: {},
    palettes: {
      lightPulse: {
        baseColor: "#00e676",
        borderColor: "#fff",
        states: {
          hovered: { color: "", borderColor: "", hue: 30, borderHue: 20, opacity: 1 },
          selected: { color: "", borderColor: "", hue: -30, borderHue: -20, opacity: 1 },
          active: { color: "", borderColor: "", hue: 60, borderHue: 40, opacity: 1 },
          unassigned: { color: "", borderColor: "", hue: -60, borderHue: -40, opacity: 0.4 },
        },
      },
      singleFirePattern: {
        baseColor: "#2196f3",
        borderColor: "#fff",
        states: {
          hovered: { color: "", borderColor: "", hue: 30, borderHue: 20, opacity: 1 },
          selected: { color: "", borderColor: "", hue: -30, borderHue: -20, opacity: 1 },
          active: { color: "", borderColor: "", hue: 60, borderHue: 40, opacity: 1 },
          unassigned: { color: "", borderColor: "", hue: -60, borderHue: -40, opacity: 0.4 },
        },
      },
      oneOffCue: {
        baseColor: "#ffd600",
        borderColor: "#fff",
        states: {
          hovered: { color: "", borderColor: "", hue: 30, borderHue: 20, opacity: 1 },
          selected: { color: "", borderColor: "", hue: -30, borderHue: -20, opacity: 1 },
          active: { color: "", borderColor: "", hue: 60, borderHue: 40, opacity: 1 },
          unassigned: { color: "", borderColor: "", hue: -60, borderHue: -40, opacity: 0.4 },
        },
      },
      changeSettings: {
        baseColor: "#ff4081",
        borderColor: "#fff",
        states: {
          hovered: { color: "", borderColor: "", hue: 30, borderHue: 20, opacity: 1 },
          selected: { color: "", borderColor: "", hue: -30, borderHue: -20, opacity: 1 },
          active: { color: "", borderColor: "", hue: 60, borderHue: 40, opacity: 1 },
          unassigned: { color: "", borderColor: "", hue: -60, borderHue: -40, opacity: 0.4 },
        },
      },
    },
    tracks: {
      mapping: { 0: undefined, 1: undefined, 2: undefined },
    },
    hydrated: true,
    rectTemplates: {
      'led-beat': {
        id: 'led-beat',
        name: 'LED Beat',
        type: 'led',
        defaultDuration: 1,
        defaultData: { pattern: 'beat', color: '#00ff00' },
        paletteName: 'lightPulse',
      },
      'led-wave': {
        id: 'led-wave',
        name: 'LED Wave',
        type: 'led',
        defaultDuration: 2,
        defaultData: { pattern: 'wave', color: '#0000ff' },
        paletteName: 'singleFirePattern',
      },
    },
  };
} 