/**
 * Minimal C API for the WASM players so JS can call init/start/update.
 * Buffer pointer is the Emscripten HEAP offset (from _malloc or passed from JS).
 */
#include "RingPlayer.h"
#include "PulsePlayer.h"
#include <cstdint>

static RingPlayer s_ring;
static bool s_ring_initialized = false;

static PulsePlayer s_pulse;
static bool s_pulse_initialized = false;

extern "C" {

void wasm_ring_init(int bufferPtr, int rows, int cols) {
    if (bufferPtr == 0 || rows <= 0 || cols <= 0) return;
    s_ring.initToGrid(reinterpret_cast<Light*>(bufferPtr), rows, cols);
    s_ring_initialized = true;
}

void wasm_ring_set_center(float rowC, float colC) {
    s_ring.setRingCenter(rowC, colC);
}

void wasm_ring_set_props(float speed, float ringWidth, float fadeRadius, float fadeWidth) {
    s_ring.setRingProps(speed, ringWidth, fadeRadius, fadeWidth);
}

void wasm_ring_set_colors(uint8_t hiR, uint8_t hiG, uint8_t hiB, uint8_t loR, uint8_t loG, uint8_t loB) {
    s_ring.hiLt.init(hiR, hiG, hiB);
    s_ring.loLt.init(loR, loG, loB);
}

void wasm_ring_start(void) {
    s_ring.Start();
}

int wasm_ring_update(float dt) {
    if (!s_ring_initialized) return 0;
    return s_ring.update(dt) ? 1 : 0;
}

void wasm_pulse_init(int bufferPtr, int numLts, uint8_t hiR, uint8_t hiG, uint8_t hiB, int pulseWidth, float speed, int doRepeat) {
    if (bufferPtr == 0 || numLts <= 0) return;
    Light hiLt(hiR, hiG, hiB);
    Light* buf = reinterpret_cast<Light*>(bufferPtr);
    s_pulse.init(*buf, numLts, hiLt, pulseWidth, speed, doRepeat != 0);
    s_pulse_initialized = true;
}

void wasm_pulse_set_color(uint8_t r, uint8_t g, uint8_t b) {
    s_pulse.setColor(r, g, b);
}

void wasm_pulse_start(void) {
    s_pulse.Start();
}

void wasm_pulse_update(float dt) {
    if (!s_pulse_initialized) return;
    s_pulse.update(dt);
}

} // extern "C"
