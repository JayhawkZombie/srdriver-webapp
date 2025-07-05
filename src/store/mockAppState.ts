import type { AppState } from "./appStore";
import {
  makeSineWave,
  makeNoise,
  makeRandomBarData,
  makeSineBarData,
  makeBeatBarData,
  makeScreenshotLikeBarData,
} from "./mockAudioData";

export function getFakeAppState(type: "sine" | "noise" | "randomBar" | "sineBar" | "beatBar" | "screenshotBar" = "sine"): AppState {
  let waveform, barData;
  switch (type) {
    case "sine":
      waveform = makeSineWave(256);
      break;
    case "noise":
      waveform = makeNoise(256);
      break;
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
      waveform = makeSineWave(256);
  }
  return {
    audio: {
      analysis: {
        waveform,
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
  };
} 