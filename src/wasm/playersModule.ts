/**
 * Load the Emscripten-built players (players.js + players.wasm) and expose a typed API
 * for the RingPlayer and buffer access.
 */

export const ROWS = 32;
export const COLS = 32;
export const NUM_LEDS = ROWS * COLS;
export const BYTES_PER_LED = 3;
export const BUFFER_BYTES = NUM_LEDS * BYTES_PER_LED;

export type PlayersModule = {
  ccall: (
    name: string,
    returnType: string,
    argTypes: string[],
    args: unknown[]
  ) => unknown;
  cwrap: (
    name: string,
    returnType: string,
    argTypes: string[]
  ) => (...args: unknown[]) => unknown;
  HEAPU8: Uint8Array;
  _malloc: (bytes: number) => number;
  _free: (ptr: number) => void;
};

let modulePromise: Promise<PlayersModule> | null = null;

/** Load players.js via script tag (classic Emscripten global Module) and resolve when runtime is ready. */
export function loadPlayersModule(): Promise<PlayersModule> {
  if (modulePromise) return modulePromise;

  // Use relative URLs so players.wasm and players.js load from the app origin (e.g. public/ in Vite).
  const wasmUrl = "players.wasm";
  const scriptUrl = "players.js";

  modulePromise = new Promise<PlayersModule>((resolve, reject) => {
    const g = globalThis as unknown as { Module?: Record<string, unknown> };
    g.Module = {
      locateFile: (path: string) => (path.endsWith(".wasm") ? wasmUrl : path),
      onRuntimeInitialized: () => {
        resolve(g.Module as unknown as PlayersModule);
      },
    };
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      if (!g.Module || typeof (g.Module as PlayersModule).ccall !== "function") {
        reject(new Error("Players module did not initialize (run wasm/build.sh and refresh)."));
      }
    };
    script.onerror = () => reject(new Error(`Failed to load ${scriptUrl}`));
    document.head.appendChild(script);
  });

  return modulePromise;
}

/** Simulation runs at this rate (fixed dt per step). */
export const SIMULATION_FPS = 60;
export const SIMULATION_DT = 1 / SIMULATION_FPS;

/**
 * Common interface for any effect that can be driven by the animation loop and drawn to the LED grid.
 * Keeps animation (fixed timestep, update) separate from rendering (getBufferView → canvas).
 */
export type CanvasEffect = {
  getBufferView: () => Uint8Array;
  clearBuffer: () => void;
  /** Advance simulation by dt; return false if effect stopped and should be restarted (e.g. one-shot ring). */
  update: (dt: number) => void | boolean;
  dispose: () => void;
  /** Called when update() returns false (optional; e.g. ring restarts, pulse ignores). */
  restart?: () => void;
};

/** Mirrors C++ RPdata: full ring config for setup() (like RingPlayerEffect). */
export type RPData = {
  center: { row: number; col: number };
  ringSpeed: number;
  ringWidth: number;
  fadeRadius: number;
  fadeWidth: number;
  amplitude: number;
  onePulse?: boolean;
  hiColor: { r: number; g: number; b: number };
  loColor: { r: number; g: number; b: number };
};

/** Ring player API using the loaded module. */
export type RingPlayerAPI = CanvasEffect & {
  bufferPtr: number;
  init: (rows?: number, cols?: number) => void;
  setCenter: (rowC: number, colC: number) => void;
  setProps: (speed: number, ringWidth: number, fadeRadius: number, fadeWidth: number) => void;
  setColors: (hiR: number, hiG: number, hiB: number, loR: number, loG: number, loB: number) => void;
  /** Apply full config via RingPlayer.setup(RPdata). Includes amplitude and onePulse. */
  setup: (rpd: RPData) => void;
  start: () => void;
};

/** Pulse player API: 1D strip, pulse travels along LEDs. */
export type PulsePlayerAPI = CanvasEffect & {
  bufferPtr: number;
  /** Initialize: buffer, num LEDs, pulse color (RGB), pulse width (LEDs), speed, repeat. */
  init: (numLeds?: number, hiR?: number, hiG?: number, hiB?: number, pulseWidth?: number, speed?: number, doRepeat?: boolean) => void;
  setColor: (r: number, g: number, b: number) => void;
  start: () => void;
};

export async function createRingPlayerAPI(module?: PlayersModule | null): Promise<RingPlayerAPI> {
  const mod = module ?? (await loadPlayersModule());
  const bufferPtr = mod._malloc(BUFFER_BYTES);
  if (bufferPtr === 0) throw new Error('WASM malloc failed for LED buffer');
  mod.HEAPU8.fill(0, bufferPtr, bufferPtr + BUFFER_BYTES);

  return {
    bufferPtr,
    getBufferView: () => mod.HEAPU8.subarray(bufferPtr, bufferPtr + BUFFER_BYTES),
    init: (rows = ROWS, cols = COLS) => {
      mod.ccall('wasm_ring_init', "void", ['number', 'number', 'number'], [bufferPtr, rows, cols]);
    },
    setCenter: (rowC: number, colC: number) => {
      mod.ccall('wasm_ring_set_center', "void", ['number', 'number'], [rowC, colC]);
    },
    setProps: (speed: number, ringWidth: number, fadeRadius: number, fadeWidth: number) => {
      mod.ccall('wasm_ring_set_props', "void", ['number', 'number', 'number', 'number'], [speed, ringWidth, fadeRadius, fadeWidth]);
    },
    setColors: (hiR: number, hiG: number, hiB: number, loR: number, loG: number, loB: number) => {
      mod.ccall('wasm_ring_set_colors', "void", ['number', 'number', 'number', 'number', 'number', 'number'], [hiR, hiG, hiB, loR, loG, loB]);
    },
    setup: (rpd: RPData) => {
      mod.ccall('wasm_ring_setup', "void",
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
        [
          rpd.center.row, rpd.center.col,
          rpd.ringSpeed, rpd.ringWidth, rpd.fadeRadius, rpd.fadeWidth,
          rpd.amplitude, (rpd.onePulse !== false) ? 1 : 0,
          rpd.hiColor.r, rpd.hiColor.g, rpd.hiColor.b,
          rpd.loColor.r, rpd.loColor.g, rpd.loColor.b,
        ]);
    },
    start: () => mod.ccall('wasm_ring_start', "void", [], []),
    update: (dt: number) => (mod.ccall('wasm_ring_update', 'number', ['number'], [dt]) as number) !== 0,
    clearBuffer: () => mod.HEAPU8.fill(0, bufferPtr, bufferPtr + BUFFER_BYTES),
    dispose: () => mod._free(bufferPtr),
    restart: function () { mod.ccall('wasm_ring_start', "void", [], []); },
  };
}

export async function createPulsePlayerAPI(module?: PlayersModule | null): Promise<PulsePlayerAPI> {
  const mod = module ?? (await loadPlayersModule());
  const bufferPtr = mod._malloc(BUFFER_BYTES);
  if (bufferPtr === 0) throw new Error('WASM malloc failed for LED buffer');
  mod.HEAPU8.fill(0, bufferPtr, bufferPtr + BUFFER_BYTES);

  return {
    bufferPtr,
    getBufferView: () => mod.HEAPU8.subarray(bufferPtr, bufferPtr + BUFFER_BYTES),
    init: (numLeds = NUM_LEDS, hiR = 0, hiG = 200, hiB = 255, pulseWidth = 8, speed = 60, doRepeat = true) => {
      mod.ccall('wasm_pulse_init', "void", ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
        [bufferPtr, numLeds, hiR, hiG, hiB, pulseWidth, speed, doRepeat ? 1 : 0]);
    },
    setColor: (r: number, g: number, b: number) => {
      mod.ccall('wasm_pulse_set_color', "void", ['number', 'number', 'number', 'number'], [bufferPtr, r, g, b]);
    },
    start: () => mod.ccall('wasm_pulse_start', "void", ['number'], [bufferPtr]),
    update: (dt: number): void => { mod.ccall('wasm_pulse_update', "void", ['number', 'number'], [bufferPtr, dt]); },
    clearBuffer: () => mod.HEAPU8.fill(0, bufferPtr, bufferPtr + BUFFER_BYTES),
    restart: function () { mod.ccall('wasm_pulse_start', "void", ['number'], [bufferPtr]); },
    dispose: () => {
      mod.ccall('wasm_pulse_dispose', "void", ['number'], [bufferPtr]);
      mod._free(bufferPtr);
    },
  };
}
