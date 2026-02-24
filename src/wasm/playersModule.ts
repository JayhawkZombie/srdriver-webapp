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
  /** Buffer pointer in WASM heap (from _malloc). Do not free while using. */
  bufferPtr: number;
  /** Get a view of the current LED buffer (r,g,b per LED). */
  getBufferView: () => Uint8Array;
  /** Initialize the ring: bind to buffer and grid size. */
  init: (rows?: number, cols?: number) => void;
  /** Set ring center in grid coords. */
  setCenter: (rowC: number, colC: number) => void;
  /** Set ring animation params. */
  setProps: (speed: number, ringWidth: number, fadeRadius: number, fadeWidth: number) => void;
  /** Set hi/lo colors (0–255). */
  setColors: (hiR: number, hiG: number, hiB: number, loR: number, loG: number, loB: number) => void;
  /** Start the ring animation. */
  start: () => void;
  /** Advance by dt seconds; returns true if still playing. */
  update: (dt: number) => boolean;
  /** Clear the LED buffer to black (call before update() each frame to avoid brightness buildup). */
  clearBuffer: () => void;
  /** Release the buffer (call when done). */
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
