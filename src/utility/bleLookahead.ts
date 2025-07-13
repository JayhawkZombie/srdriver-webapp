// BLE Lookahead Utility
// Schedules a BLE command to be sent with lookahead and RTT compensation.
// Usage: scheduleBLECommand(() => controller.setPattern(...), targetTime, { lookaheadMs: 100, rttMs: 50, debug: true });

type BLECommand = () => void;

interface LookaheadOptions {
  lookaheadMs: number; // How early to send, e.g. 100ms
  rttMs?: number;      // Measured BLE RTT (optional)
  debug?: boolean;
}

export function scheduleBLECommand(
  command: BLECommand,
  targetTime: number, // When you want the effect to happen (epoch ms)
  options: LookaheadOptions
) {
  const { lookaheadMs, rttMs = 0, debug = false } = options;
  const now = Date.now();
  const sendTime = targetTime - lookaheadMs - rttMs;
  const delay = Math.max(0, sendTime - now);

  if (debug) {
    console.log(
      `[BLE Lookahead] Scheduling command: now=${now}, target=${targetTime}, lookahead=${lookaheadMs}, rtt=${rttMs}, delay=${delay}`
    );
  }

  const timeout = setTimeout(() => {
    if (debug) console.log(`[BLE Lookahead] Sending BLE command at ${Date.now()}`);
    command();
  }, delay);

  // Return a cancel function
  return () => clearTimeout(timeout);
} 