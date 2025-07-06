/**
 * Convert a time value to an X pixel position in the timeline window.
 * @param {Object} params
 * @param {number} params.time - The time value to convert.
 * @param {number} params.windowStart - The start time of the visible window.
 * @param {number} params.windowDuration - The duration of the visible window.
 * @param {number} params.width - The width in pixels of the timeline area.
 * @returns {number} The X position in pixels.
 */
export function timeToXWindow({ time, windowStart, windowDuration, width }: { time: number, windowStart: number, windowDuration: number, width: number }): number {
  return ((time - windowStart) / windowDuration) * width;
}

/**
 * Convert an X pixel position in the timeline window to a time value.
 * @param {Object} params
 * @param {number} params.x - The X position in pixels.
 * @param {number} params.windowStart - The start time of the visible window.
 * @param {number} params.windowDuration - The duration of the visible window.
 * @param {number} params.width - The width in pixels of the timeline area.
 * @returns {number} The corresponding time value.
 */
export function xToTime({ x, windowStart, windowDuration, width }: { x: number, windowStart: number, windowDuration: number, width: number }): number {
  return windowStart + (x / width) * windowDuration;
}

/**
 * Get the Y position (top) of a track given its index.
 * @param {number} trackIndex - The index of the track (0-based).
 * @param {number} trackHeight - The height of each track in px.
 * @param {number} trackGap - The gap between tracks in px.
 * @param {number} topOffset - The Y offset from the top of the timeline area.
 * @returns {number} The Y position (top) of the track.
 */
export function trackIndexToY(trackIndex: number, trackHeight: number, trackGap: number, topOffset: number): number {
  return topOffset + trackIndex * (trackHeight + trackGap);
}

/**
 * Get the track index for a given Y position.
 * @param {number} y - The Y position in px.
 * @param {number} trackHeight - The height of each track in px.
 * @param {number} trackGap - The gap between tracks in px.
 * @param {number} topOffset - The Y offset from the top of the timeline area.
 * @param {number} numTracks - The total number of tracks.
 * @returns {number} The track index (0-based), or -1 if not in any track.
 */
export function yToTrackIndex(y: number, trackHeight: number, trackGap: number, topOffset: number, numTracks: number): number {
  for (let i = 0; i < numTracks; i++) {
    const top = topOffset + i * (trackHeight + trackGap);
    const bottom = top + trackHeight;
    if (y >= top && y < bottom) return i;
  }
  return -1;
}

/**
 * Clamp a response's duration so it does not extend past the timeline's end.
 * @param {number} timestamp - The start time of the response.
 * @param {number} duration - The desired duration.
 * @param {number} totalDuration - The total timeline duration.
 * @param {number} minDuration - The minimum allowed duration.
 * @returns {number} The clamped duration (or 0 if not possible).
 */
export function clampResponseDuration(timestamp: number, duration: number, totalDuration: number, minDuration: number): number {
  let maxAllowed = totalDuration - timestamp;
  if (maxAllowed < minDuration) return 0;
  return Math.max(minDuration, Math.min(duration, maxAllowed));
}

// Shared geometry type for timeline pointer calculations
export type TimelineGeometry = {
  windowStart: number;
  windowDuration: number;
  tracksWidth: number;
  tracksTopOffset: number;
  trackHeight: number;
  trackGap: number;
  numTracks: number;
  totalDuration: number;
};

/**
 * Given pointer x/y and timeline geometry, return the timeline time and track index, or null if out of bounds.
 */
export function getTimelinePointerInfo({
  pointerX,
  pointerY,
  boundingRect,
  ...geometry
}: {
  pointerX: number;
  pointerY: number;
  boundingRect: DOMRect;
} & TimelineGeometry) {
  console.log('[DEBUG] getTimelinePointerInfo called', { pointerX, pointerY, boundingRect, geometry });
  const x = pointerX - boundingRect.left;
  const y = pointerY - boundingRect.top;
  console.log('[DEBUG] getTimelinePointerInfo local x/y:', { x, y }, geometry);
  if (x < 0 || x > geometry.tracksWidth) return null;
  const time = xToTime({ x, windowStart: geometry.windowStart, windowDuration: geometry.windowDuration, width: geometry.tracksWidth });
  if (time < 0 || time > geometry.totalDuration) return null;
  const trackIndex = yToTrackIndex(y, geometry.trackHeight, geometry.trackGap, geometry.tracksTopOffset, geometry.numTracks);
  if (trackIndex < 0) return null;
  return { time, trackIndex };
} 

/**
 * Snap a Y position to the nearest valid track index (0-based, clamped).
 * @param {number} y - The Y position in px.
 * @param {TimelineGeometry} geometry - Timeline geometry.
 * @returns {number} The nearest valid track index (0-based).
 */
export function snapYToTrackIndex(y: number, geometry: TimelineGeometry): number {
  const { trackHeight, trackGap, tracksTopOffset, numTracks } = geometry;
  const idx = Math.round((y - tracksTopOffset) / (trackHeight + trackGap));
  return Math.max(0, Math.min(numTracks - 1, idx));
}

/**
 * Get the vertical center Y position for a given track index.
 * @param {number} trackIndex - The index of the track (0-based).
 * @param {TimelineGeometry} geometry - Timeline geometry.
 * @returns {number} The Y position (center) of the track.
 */
export function trackIndexToCenterY(trackIndex: number, geometry: TimelineGeometry): number {
  const { trackHeight, trackGap, tracksTopOffset } = geometry;
  return tracksTopOffset + trackIndex * (trackHeight + trackGap) + trackHeight / 2;
} 