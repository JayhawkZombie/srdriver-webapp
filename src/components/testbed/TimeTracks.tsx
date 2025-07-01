import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { Devices, GraphicEq, Label } from '@mui/icons-material';
import ResponseRect from './ResponseRect';

// Timeline constants
const TRACK_HEIGHT = 40;
const TRACK_GAP = 10;
const NUM_TRACKS = 4;
const DURATION = 15; // seconds
const DEFAULT_RESPONSE_DURATION = 1; // seconds
const LABEL_WIDTH = 160; // even more space for icons, color, and name

// MUI-like colors
const muiBg = '#21262c';
const muiTrack = '#2d333b';
const muiText = '#e3e6eb';
const muiAccent = '#90caf9';
const muiShadow = 'rgba(0,0,0,0.18)';

// Dynamic xToTime based on current timeline width
// (TIMELINE_WIDTH is now only used for legacy code, not for actual rendering)

interface ResponseEvent {
  start: number;
  end: number;
  track: number;
}

const TRACK_TYPES = [
  { type: 'device', label: 'Device', color: '#ffb300', icon: Devices },
  { type: 'frequency', label: 'Frequency', color: '#42a5f5', icon: GraphicEq },
  { type: 'custom', label: 'Custom', color: '#ab47bc', icon: Label },
] as const;
type TrackType = typeof TRACK_TYPES[number]['type'];

const TEMPLATES: { name: string; tracks: { name: string; type: TrackType }[] }[] = [
  {
    name: 'Music-Driven',
    tracks: [
      { name: 'Bass', type: 'frequency' },
      { name: 'Snare', type: 'frequency' },
      { name: 'FX', type: 'frequency' },
      { name: 'Lights', type: 'device' },
    ],
  },
  {
    name: 'Device-Driven',
    tracks: [
      { name: 'Front Wash', type: 'device' },
      { name: 'Lasers', type: 'device' },
      { name: 'Strobes', type: 'device' },
      { name: 'FX', type: 'custom' },
    ],
  },
  {
    name: 'Hybrid',
    tracks: [
      { name: 'Bass', type: 'frequency' },
      { name: 'Snare', type: 'frequency' },
      { name: 'Front Wash', type: 'device' },
      { name: 'FX', type: 'custom' },
    ],
  },
];

const UNDERLAY_OPTIONS = ['None', 'Waveform', 'Frequency'] as const;
type UnderlayType = typeof UNDERLAY_OPTIONS[number];

interface Track {
  name: string;
  type: TrackType;
}

const defaultTracks: Track[] = [
  { name: 'Bass', type: 'frequency' },
  { name: 'Snare', type: 'frequency' },
  { name: 'FX', type: 'custom' },
  { name: 'Lights', type: 'device' },
];

const TimeTracks: React.FC = () => {
  const [responses, setResponses] = useState<ResponseEvent[]>([]);
  const [playhead, setPlayhead] = useState(0);
  const [tracks, setTracks] = useState<Track[]>(defaultTracks);
  const [editingTrack, setEditingTrack] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingType, setEditingType] = useState<TrackType | null>(null);
  const [templateIdx, setTemplateIdx] = useState(0);
  const animRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const [underlay, setUnderlay] = useState<UnderlayType>('None');
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [timelineSize, setTimelineSize] = useState({ width: 800, height: 400 });

  // Dynamically size timeline to fill parent
  useEffect(() => {
    const handleResize = () => {
      if (timelineContainerRef.current) {
        const rect = timelineContainerRef.current.getBoundingClientRect();
        // Height is based on tracks, but can fill parent if taller
        const neededHeight = 40 + tracks.length * (TRACK_HEIGHT + TRACK_GAP) + 20;
        setTimelineSize({
          width: Math.max(400, rect.width),
          height: Math.max(neededHeight, Math.min(rect.height, window.innerHeight * 0.7)),
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tracks.length]);

  // Draw a mock waveform or frequency plot on a canvas
  const underlayCanvasRef = useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = underlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (underlay === 'Waveform') {
      // Draw a mock waveform (sine wave)
      ctx.strokeStyle = '#90caf9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const t = x / canvas.width * 4 * Math.PI;
        const y = canvas.height / 2 + Math.sin(t) * (canvas.height / 3);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (underlay === 'Frequency') {
      // Draw a mock frequency band plot (bars)
      const bands = 8;
      for (let i = 0; i < bands; i++) {
        const barHeight = Math.abs(Math.sin(i + 1)) * (canvas.height * 0.7);
        ctx.fillStyle = `rgba(144,202,249,${0.3 + 0.5 * (i % 2)})`;
        ctx.fillRect(
          (canvas.width / bands) * i + 4,
          canvas.height - barHeight - 6,
          (canvas.width / bands) - 8,
          barHeight
        );
      }
    }
  }, [underlay]);

  // Start/stop playhead animation
  const startPlayhead = () => {
    if (playingRef.current) return;
    playingRef.current = true;
    const start = performance.now() - (playhead * 1000);
    const animate = (now: number) => {
      if (!playingRef.current) return;
      const t = Math.min((now - start) / 1000, DURATION);
      setPlayhead(t);
      if (t < DURATION) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        playingRef.current = false;
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };
  const stopPlayhead = () => {
    playingRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };
  const resetPlayhead = () => {
    stopPlayhead();
    setPlayhead(0);
  };

  // Dynamic xToTime based on current timeline width
  // (TIMELINE_WIDTH is now only used for legacy code, not for actual rendering)
  const xToTimeLocal = (x: number) => ((x - 50) / (timelineSize.width - 60)) * DURATION;

  // Handle click to add response
  const handleStageClick = (e: KonvaEventObject<PointerEvent>) => {
    if (editingTrack !== null) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const { x, y } = pointer;
    for (let i = 0; i < NUM_TRACKS; i++) {
      const top = 40 + i * (TRACK_HEIGHT + TRACK_GAP);
      if (y >= top && y <= top + TRACK_HEIGHT) {
        const start = Math.max(0, Math.min(DURATION - DEFAULT_RESPONSE_DURATION, xToTimeLocal(x)));
        const end = Math.min(DURATION, start + DEFAULT_RESPONSE_DURATION);
        setResponses((prev) => [...prev, { start, end, track: i }]);
        break;
      }
    }
  };

  // Handle drag of left/right handle
  const handleResize = (idx: number, edge: 'left' | 'right', newTime: number) => {
    setResponses((prev) => prev.map((resp, i) => {
      if (i !== idx) return resp;
      if (edge === 'left') {
        // Clamp to not go past end, and not before 0
        const newStart = Math.max(0, Math.min(resp.end - 0.1, newTime));
        return { ...resp, start: newStart };
      } else {
        // Clamp to not go before start, and not after DURATION
        const newEnd = Math.min(DURATION, Math.max(resp.start + 0.1, newTime));
        return { ...resp, end: newEnd };
      }
    }));
  };

  // Handle track name input change
  const handleTrackNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };

  // Handle template selection
  const handleTemplateSelect = (idx: number) => {
    setTemplateIdx(idx);
    setTracks(TEMPLATES[idx].tracks.map(t => ({ ...t })));
    setEditingTrack(null);
    setEditingValue('');
    setEditingType(null);
  };

  // Handle track name/type input blur or enter
  const handleTrackNameCommit = () => {
    if (editingTrack !== null) {
      setTracks((prev) => prev.map((track, i) =>
        i === editingTrack
          ? {
              ...track,
              name: editingValue.trim() || track.name,
              type: editingType ?? track.type,
            }
          : track
      ));
      setEditingTrack(null);
      setEditingValue('');
      setEditingType(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      top: '3vh',
      transform: 'translateX(-50%)',
      width: '98vw',
      minHeight: '90vh',
      maxHeight: '94vh',
      overflow: 'auto',
      background: muiBg,
      borderRadius: 18,
      boxShadow: `0 4px 48px ${muiShadow}`,
      padding: 56,
      color: muiText,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}>
      <h3 style={{ color: muiAccent, marginTop: 0 }}>Timeline Testbed (react-konva demo)</h3>
      <div style={{ marginBottom: 16 }}>
        <button onClick={startPlayhead} disabled={playingRef.current} style={{ marginRight: 8, borderRadius: 6, background: muiAccent, color: muiBg, border: 'none', padding: '6px 16px', fontWeight: 600 }}>Play</button>
        <button onClick={stopPlayhead} disabled={!playingRef.current} style={{ marginRight: 8, borderRadius: 6, background: '#b0bec5', color: muiBg, border: 'none', padding: '6px 16px', fontWeight: 600 }}>Pause</button>
        <button onClick={resetPlayhead} style={{ borderRadius: 6, background: '#b0bec5', color: muiBg, border: 'none', padding: '6px 16px', fontWeight: 600 }}>Reset</button>
      </div>
      {/* Template selector */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 600, color: muiAccent }}>Template:</span>
        {TEMPLATES.map((tpl, idx) => (
          <button
            key={tpl.name}
            onClick={() => handleTemplateSelect(idx)}
            style={{
              marginRight: 6,
              borderRadius: 6,
              background: templateIdx === idx ? muiAccent : '#b0bec5',
              color: templateIdx === idx ? muiBg : muiText,
              border: 'none',
              padding: '4px 14px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: templateIdx === idx ? `2px solid ${muiAccent}` : 'none',
            }}
          >
            {tpl.name}
          </button>
        ))}
      </div>
      {/* Underlay toggle */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 600, color: muiAccent }}>Underlay:</span>
        {UNDERLAY_OPTIONS.map((opt: UnderlayType) => (
          <button
            key={opt}
            onClick={() => setUnderlay(opt)}
            style={{
              marginRight: 6,
              borderRadius: 6,
              background: underlay === opt ? muiAccent : '#b0bec5',
              color: underlay === opt ? muiBg : muiText,
              border: 'none',
              padding: '4px 14px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: underlay === opt ? `2px solid ${muiAccent}` : 'none',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <div
        ref={timelineContainerRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          width: '100%',
          height: timelineSize.height,
          background: muiBg,
          borderRadius: 16,
          boxShadow: `0 2px 24px ${muiShadow}`,
        }}
      >
        {/* Track labels column */}
        <div style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 40, height: '100%' }}>
          {tracks.map((track, i) => (
            editingTrack === i ? (
              <div key={i} style={{ width: LABEL_WIDTH - 10, marginBottom: TRACK_GAP, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="text"
                  value={editingValue}
                  autoFocus
                  onChange={handleTrackNameChange}
                  onBlur={handleTrackNameCommit}
                  onKeyDown={e => { if (e.key === 'Enter') handleTrackNameCommit(); }}
                  style={{
                    width: LABEL_WIDTH - 38,
                    height: 28,
                    fontSize: 15,
                    borderRadius: 6,
                    border: `1px solid ${muiAccent}`,
                    background: muiTrack,
                    color: muiText,
                    paddingLeft: 4,
                    outline: 'none',
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                />
                <select
                  value={editingType ?? track.type}
                  onChange={e => setEditingType(e.target.value as TrackType)}
                  style={{
                    height: 28,
                    borderRadius: 6,
                    border: `1px solid ${muiAccent}`,
                    background: muiTrack,
                    color: muiText,
                    fontWeight: 600,
                    outline: 'none',
                    padding: '0 4px',
                  }}
                >
                  {TRACK_TYPES.map(tt => (
                    <option key={tt.type} value={tt.type}>{tt.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div
                key={i}
                style={{
                  width: LABEL_WIDTH - 10,
                  height: TRACK_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  color: TRACK_TYPES.find(tt => tt.type === track.type)?.color || muiAccent,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  userSelect: 'none',
                  marginBottom: TRACK_GAP,
                  gap: 4,
                }}
                onClick={() => {
                  setEditingTrack(i);
                  setEditingValue(track.name);
                  setEditingType(track.type);
                }}
                tabIndex={0}
                role="button"
                aria-label={`Rename track ${track.name}`}
              >
                {(() => {
                  const Icon = TRACK_TYPES.find(tt => tt.type === track.type)?.icon;
                  return Icon ? <Icon style={{ fontSize: 18, marginRight: 2, verticalAlign: 'middle' }} /> : null;
                })()}
                {track.name}
              </div>
            )
          ))}
        </div>
        {/* Timeline Stage with underlay canvas absolutely positioned */}
        <div style={{
          flex: 1,
          minWidth: 400,
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Underlay canvas */}
          {underlay !== 'None' && (
            <canvas
              ref={underlayCanvasRef}
              width={timelineSize.width - 60}
              height={timelineSize.height - 40}
              style={{
                position: 'absolute',
                left: 50,
                top: 40,
                width: `calc(100% - 60px)`,
                height: timelineSize.height - 40,
                zIndex: 0,
                opacity: 0.35,
                pointerEvents: 'none',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            />
          )}
          <Stage
            width={timelineSize.width}
            height={timelineSize.height}
            style={{ background: 'none', borderRadius: 10, width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
            onClick={handleStageClick}
          >
            <Layer>
              {/* Draw timeline axis */}
              <Line points={[50, 30, timelineSize.width - 10, 30]} stroke={muiText} strokeWidth={2} />
              {/* Draw time ticks */}
              {Array.from({ length: DURATION + 1 }).map((_, i) => {
                const tickX = 50 + ((timelineSize.width - 60) * (i / DURATION));
                return (
                  <Group key={i}>
                    <Line points={[tickX, 25, tickX, 35]} stroke={muiText} strokeWidth={1} />
                    <Text x={tickX - 8} y={10} text={i.toString()} fontSize={12} fill={muiText} />
                  </Group>
                );
              })}
              {/* Draw tracks */}
              {tracks.map((track, i) => {
                const y = 40 + i * (TRACK_HEIGHT + TRACK_GAP);
                return (
                  <Group key={track.name + i}>
                    <Rect x={50} y={y} width={timelineSize.width - 60} height={TRACK_HEIGHT} fill={'rgba(45,51,59,0.25)'} cornerRadius={8} shadowBlur={4} shadowColor={muiShadow} />
                  </Group>
                );
              })}
              {/* Draw responses */}
              {responses.map((resp, idx) => {
                const y = 40 + resp.track * (TRACK_HEIGHT + TRACK_GAP);
                const timeToXLocal = (time: number) => (time / DURATION) * (timelineSize.width - 60) + 50;
                const x1 = timeToXLocal(resp.start);
                const x2 = timeToXLocal(resp.end);
                return (
                  <ResponseRect
                    key={idx}
                    x1={x1}
                    x2={x2}
                    y={y + 8}
                    height={TRACK_HEIGHT - 16}
                    fill={muiAccent}
                    shadowColor={muiShadow}
                    shadowBlur={4}
                    cornerRadius={4}
                    onResizeLeft={newStart => {
                      if (Math.abs(newStart - resp.start) > 1e-4 && newStart < resp.end - 0.1 && newStart >= 0) {
                        handleResize(idx, 'left', newStart);
                      }
                    }}
                    onResizeRight={newEnd => {
                      if (Math.abs(newEnd - resp.end) > 1e-4 && newEnd > resp.start + 0.1 && newEnd <= DURATION) {
                        handleResize(idx, 'right', newEnd);
                      }
                    }}
                    onResizeLeftEnd={e => {
                      e.target.position({ x: x1 - 5, y: y + 8 });
                    }}
                    onResizeRightEnd={e => {
                      e.target.position({ x: x2 - 5, y: y + 8 });
                    }}
                    xToTime={xToTimeLocal}
                    minX={50}
                    maxX={timelineSize.width - 10}
                  />
                );
              })}
              {/* Draw playhead */}
              <Line
                points={[
                  50 + ((timelineSize.width - 60) * (playhead / DURATION)),
                  30,
                  50 + ((timelineSize.width - 60) * (playhead / DURATION)),
                  timelineSize.height - 10,
                ]}
                stroke="#ff5252"
                strokeWidth={2}
                dash={[8, 6]}
              />
            </Layer>
          </Stage>
        </div>
      </div>
      <div style={{ color: '#b0bec5', marginTop: 12, fontSize: 15 }}>
        <p>Click on a track name to rename it. Click on a track to add a response at that time. Use Play/Pause/Reset to control the playhead.</p>
        <p>Use the Underlay toggle above to preview how a waveform or frequency plot would look beneath your timeline.</p>
      </div>
    </div>
  );
};

export default TimeTracks; 