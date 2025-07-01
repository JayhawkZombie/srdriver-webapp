// Timeline math and constants for consistent rendering and state logic

export const TIMELINE_LEFT = 50;
export const TIMELINE_RIGHT_PAD = 10;
export const TRACK_HEIGHT = 40;
export const TRACK_GAP = 10;

// Offset from track top to response rect top
export const RESPONSE_RECT_Y_OFFSET = 8;
// Inner height of response rect (leaves 8px padding top/bottom)
export const RESPONSE_RECT_HEIGHT_INNER = TRACK_HEIGHT - 16;
// Offset for handle position relative to rect
export const HANDLE_OFFSET = 5;

// Converts time (seconds) to X coordinate
export function timeToX({
    time,
    duration,
    width,
}: {
    time: number;
    duration: number;
    width: number;
}) {
    return (
        (time / duration) * (width - TIMELINE_LEFT - TIMELINE_RIGHT_PAD) +
        TIMELINE_LEFT
    );
}

// Converts X coordinate to time (seconds)
export function xToTime({
    x,
    duration,
    width,
}: {
    x: number;
    duration: number;
    width: number;
}) {
    return (
        ((x - TIMELINE_LEFT) / (width - TIMELINE_LEFT - TIMELINE_RIGHT_PAD)) *
        duration
    );
}

// Returns the center Y coordinate for a given track index
export function trackIndexToCenterY(trackIdx: number) {
    // Track rows start at y=40, each row is TRACK_HEIGHT tall with TRACK_GAP between
    // The response rect is drawn at y+8 with height TRACK_HEIGHT-16, so its center is:
    // 40 + i * (TRACK_HEIGHT + TRACK_GAP) + (TRACK_HEIGHT - 16)/2 + 8
    return (
        40 + trackIdx * (TRACK_HEIGHT + TRACK_GAP) + (TRACK_HEIGHT - 16) / 2 + 8
    );
}

// Returns the track index for a given center Y coordinate
export function centerYToTrackIndex(centerY: number, numTracks: number) {
    // Invert the above formula, then clamp to [0, numTracks-1]
    const idx = Math.round(
        (centerY - 40 - (TRACK_HEIGHT - 16) / 2 - 8) /
            (TRACK_HEIGHT + TRACK_GAP)
    );
    return Math.max(0, Math.min(numTracks - 1, idx));
}

/**
 * Returns the Y position for a response rect given a track index.
 */
export function trackIndexToRectY(trackIdx: number) {
    return 40 + trackIdx * (TRACK_HEIGHT + TRACK_GAP) + RESPONSE_RECT_Y_OFFSET;
}

/**
 * Returns the X position for the left handle given the main rect X.
 */
export function leftHandleX(mainX: number) {
    return mainX - HANDLE_OFFSET;
}

/**
 * Returns the X position for the right handle given the main rect X and width.
 */
export function rightHandleX(mainX: number, width: number) {
    return mainX + width - HANDLE_OFFSET;
}

/**
 * Returns the width of the main rect, given x1, x2, and optional drag handle state.
 * If dragRightX is active, use it; else if dragLeftX is active, use it; else use x2 - x1.
 */
export function mainRectWidth(
    x1: number,
    x2: number,
    dragLeftX: number | null,
    dragRightX: number | null
) {
    if (dragRightX !== null)
        return (
            dragRightX -
            (dragLeftX !== null ? dragLeftX + HANDLE_OFFSET : x1) +
            HANDLE_OFFSET
        );
    if (dragLeftX !== null) return x2 - (dragLeftX + HANDLE_OFFSET);
    return x2 - x1;
}
