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

  const base = import.meta.env.BASE_URL;
  const wasmUrl = `${base}players.wasm`;
  const scriptUrl = `${base}players.js`;

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

/** Ring player API using the loaded module. */
export type RingPlayerAPI = {
  bufferPtr: number;
  getBufferView: () => Uint8Array;
  init: (rows?: number, cols?: number) => void;
  setCenter: (rowC: number, colC: number) => void;
  setProps: (speed: number, ringWidth: number, fadeRadius: number, fadeWidth: number) => void;
  setColors: (hiR: number, hiG: number, hiB: number, loR: number, loG: number, loB: number) => void;
  start: () => void;
  update: (dt: number) => boolean;
  clearBuffer: () => void;
  dispose: () => void;
};

/** Pulse player API: 1D strip, pulse travels along LEDs. */
export type PulsePlayerAPI = {
  bufferPtr: number;
  getBufferView: () => Uint8Array;
  /** Initialize: buffer, num LEDs, pulse color (RGB), pulse width (LEDs), speed, repeat. */
  init: (numLeds?: number, hiR?: number, hiG?: number, hiB?: number, pulseWidth?: number, speed?: number, doRepeat?: boolean) => void;
  setColor: (r: number, g: number, b: number) => void;
  start: () => void;
  update: (dt: number) => void;
  clearBuffer: () => void;
  dispose: () => void;
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
      mod.ccall('wasm_ring_init', null, ['number', 'number', 'number'], [bufferPtr, rows, cols]);
    },
    setCenter: (rowC: number, colC: number) => {
      mod.ccall('wasm_ring_set_center', null, ['number', 'number'], [rowC, colC]);
    },
    setProps: (speed: number, ringWidth: number, fadeRadius: number, fadeWidth: number) => {
      mod.ccall('wasm_ring_set_props', null, ['number', 'number', 'number', 'number'], [speed, ringWidth, fadeRadius, fadeWidth]);
    },
    setColors: (hiR: number, hiG: number, hiB: number, loR: number, loG: number, loB: number) => {
      mod.ccall('wasm_ring_set_colors', null, ['number', 'number', 'number', 'number', 'number', 'number'], [hiR, hiG, hiB, loR, loG, loB]);
    },
    start: () => mod.ccall('wasm_ring_start', null, [], []),
    update: (dt: number) => (mod.ccall('wasm_ring_update', 'number', ['number'], [dt]) as number) !== 0,
    clearBuffer: () => mod.HEAPU8.fill(0, bufferPtr, bufferPtr + BUFFER_BYTES),
    dispose: () => mod._free(bufferPtr),
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
      mod.ccall('wasm_pulse_init', null, ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
        [bufferPtr, numLeds, hiR, hiG, hiB, pulseWidth, speed, doRepeat ? 1 : 0]);
    },
    setColor: (r: number, g: number, b: number) => {
      mod.ccall('wasm_pulse_set_color', null, ['number', 'number', 'number'], [r, g, b]);
    },
    start: () => mod.ccall('wasm_pulse_start', null, [], []),
    update: (dt: number) => mod.ccall('wasm_pulse_update', null, ['number'], [dt]),
    clearBuffer: () => mod.HEAPU8.fill(0, bufferPtr, bufferPtr + BUFFER_BYTES),
    dispose: () => mod._free(bufferPtr),
  };
}
