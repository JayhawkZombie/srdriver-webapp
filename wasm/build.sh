#!/usr/bin/env bash
# Build the C++ players to WebAssembly and emit players.js + players.wasm into public/.
# Requires Emscripten: source ~/emsdk/emsdk_env.sh (or your emsdk path) before running.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ------------------------------------------------------------------------------
# Paths (order: build on SCRIPT_DIR, then outputs from build dir)
# ------------------------------------------------------------------------------
BUILD_DIR="${SCRIPT_DIR}/build"
PUBLIC_DIR="${SCRIPT_DIR}/../public"
PLAYERS_JS="${BUILD_DIR}/players.js"
PLAYERS_WASM="${BUILD_DIR}/players.wasm"

# ------------------------------------------------------------------------------
# Emscripten export lists (keep in sync with CMakeLists.txt)
# ------------------------------------------------------------------------------
EXPORTED_RUNTIME_METHODS=(
  ccall
  cwrap
  HEAPU8
)
EXPORTED_RUNTIME_METHODS_STR=""
first=1
for m in "${EXPORTED_RUNTIME_METHODS[@]}"; do
  if [[ $first -eq 1 ]]; then first=0; else EXPORTED_RUNTIME_METHODS_STR+=","; fi
  EXPORTED_RUNTIME_METHODS_STR+="$m"
done

EXPORTED_FUNCTIONS=(
  _malloc
  _free
  _wasm_ring_init
  _wasm_ring_set_center
  _wasm_ring_set_props
  _wasm_ring_set_colors
  _wasm_ring_setup
  _wasm_ring_start
  _wasm_ring_update
  _wasm_pulse_init
  _wasm_pulse_set_color
  _wasm_pulse_start
  _wasm_pulse_update
  _wasm_pulse_dispose
)

EXPORTED_FUNCTIONS_JSON="["
first=1
for f in "${EXPORTED_FUNCTIONS[@]}"; do
  if [[ $first -eq 1 ]]; then first=0; else EXPORTED_FUNCTIONS_JSON+=","; fi
  EXPORTED_FUNCTIONS_JSON+="\"$f\""
done
EXPORTED_FUNCTIONS_JSON+="]"

# ------------------------------------------------------------------------------
# Sources and include (keep in sync with CMakeLists.txt PLAYERS_SOURCES)
# ------------------------------------------------------------------------------
SOURCES=(
  "${SCRIPT_DIR}/src/RingPlayer.cpp"
  "${SCRIPT_DIR}/src/PulsePlayer.cpp"
  "${SCRIPT_DIR}/src/vec2f.cpp"
  "${SCRIPT_DIR}/src/players_api.cpp"
)
INCLUDE=(-I"${SCRIPT_DIR}/include" -I"${SCRIPT_DIR}/src")

# ------------------------------------------------------------------------------
# em++ flags for direct build (-o and -s options; used as em++ ... "${EMCC_FLAGS[@]}")
# ------------------------------------------------------------------------------
EMCC_FLAGS=(
  -o "$PLAYERS_JS"
  -s "EXPORTED_FUNCTIONS=${EXPORTED_FUNCTIONS_JSON}"
  -s "EXPORTED_RUNTIME_METHODS=${EXPORTED_RUNTIME_METHODS_STR}"
  -s ALLOW_MEMORY_GROWTH=1
  -s ENVIRONMENT=web
)

# ------------------------------------------------------------------------------
# Build
# ------------------------------------------------------------------------------
if ! command -v emcmake &>/dev/null && ! command -v em++ &>/dev/null; then
  echo "Emscripten not found. Source the Emscripten SDK first, e.g.:"
  echo "  source ~/emsdk/emsdk_env.sh"
  exit 1
fi

if command -v emcmake &>/dev/null; then
  echo "Building with CMake (Emscripten)..."
  emcmake cmake -B "$BUILD_DIR" -S "$SCRIPT_DIR"
  emmake cmake --build "$BUILD_DIR"
else
  echo "Building with em++ directly..."
  mkdir -p "$BUILD_DIR"
  em++ "${INCLUDE[@]}" "${SOURCES[@]}" "${EMCC_FLAGS[@]}"
fi

if [[ ! -f "$PLAYERS_JS" || ! -f "$PLAYERS_WASM" ]]; then
  echo "Build failed: players.js or players.wasm not produced."
  exit 1
fi

mkdir -p "$PUBLIC_DIR"
cp "$PLAYERS_JS" "$PLAYERS_WASM" "$PUBLIC_DIR/"
echo "Done. Copied players.js and players.wasm to public/."
ls -la "$PUBLIC_DIR"/players.*
