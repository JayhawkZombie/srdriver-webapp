import type { AppState } from "./appStore";

export function getFakeAppState(): AppState {
  return {
    audio: {
      analysis: {
        waveform: [],
        duration: 4,
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
    templateTypes: [
      { value: 'pulse', label: 'Pulse' },
      { value: 'pattern', label: 'Pattern' },
      { value: 'cue', label: 'Cue' },
      { value: 'settings', label: 'Settings Change' },
      { value: 'led', label: 'LED' },
    ],
  };
} 