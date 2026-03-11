/**
 * Minimal C API for the WASM players so JS can call init/start/update.
 * Buffer pointer is the Emscripten HEAP offset (from _malloc or passed from JS).
 * Pulse supports multiple instances keyed by bufferPtr; ring remains single-instance.
 */
#include "RingPlayer.h"
#include "PulsePlayer.h"
#include <cstdint>
#include <map>

static RingPlayer s_ring;
static bool s_ring_initialized = false;

static std::map<int, PulsePlayer> s_pulse_instances;

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
    PulsePlayer& p = s_pulse_instances[bufferPtr];
    p.init(*buf, numLts, hiLt, pulseWidth, speed, doRepeat != 0);
}

void wasm_pulse_set_color(int bufferPtr, uint8_t r, uint8_t g, uint8_t b) {
    auto it = s_pulse_instances.find(bufferPtr);
    if (it == s_pulse_instances.end()) return;
    it->second.setColor(r, g, b);
}

void wasm_pulse_start(int bufferPtr) {
    auto it = s_pulse_instances.find(bufferPtr);
    if (it == s_pulse_instances.end()) return;
    it->second.Start();
}

void wasm_pulse_update(int bufferPtr, float dt) {
    auto it = s_pulse_instances.find(bufferPtr);
    if (it == s_pulse_instances.end()) return;
    it->second.update(dt);
}

void wasm_pulse_dispose(int bufferPtr) {
    s_pulse_instances.erase(bufferPtr);
}

} // extern "C"
