// Common event format for all detection engines
export interface DetectionEvent {
  time: number;         // Time in seconds
  strength?: number;    // Optional: normalized or raw strength
  duration?: number;    // Optional: duration in seconds (for sustained events)
  band?: string;        // Optional: frequency band name
  [key: string]: any;   // Extensible for future features
} 