import React, { useState, useContext } from "react";
import { Button, Icon, H6 } from '@blueprintjs/core';
import { useBenchmarkStore } from '../../store/benchmarkStore';
import { WindowedTimeSeriesPlot } from '../custom-timeline/WindowedTimeSeriesPlot';
import { UnifiedThemeContext } from '../../context/UnifiedThemeContext';

export const Profiling: React.FC<{ onClose: () => void; compact?: boolean; onToggleCompact?: () => void; }> = ({ onClose, onToggleCompact }) => {
  const theme = useContext(UnifiedThemeContext);
  const darkMode = theme?.mode === 'dark';
  const { timeSeries, oneOffs } = useBenchmarkStore();
  const timeSeriesKeys = Object.keys(timeSeries);
  const oneOffKeys = Object.keys(oneOffs);
  const allKeys = [...timeSeriesKeys, ...oneOffKeys];
  const [selectedKey, setSelectedKey] = useState<string | null>(allKeys[0] || null);
  // Update selectedKey if keys change
  React.useEffect(() => {
    if (allKeys.length === 0) {
      if (selectedKey !== null) setSelectedKey(null);
    } else if (!selectedKey || !allKeys.includes(selectedKey)) {
      setSelectedKey(allKeys[0]);
    }
  }, [allKeys, selectedKey]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const isTimeSeries = selectedKey && timeSeriesKeys.includes(selectedKey);
  const isOneOff = selectedKey && oneOffKeys.includes(selectedKey);
  const tsSamples = isTimeSeries && selectedKey ? timeSeries[selectedKey] : [];
  const oneOffSample = isOneOff && selectedKey ? oneOffs[selectedKey] : undefined;

  return (
    <div className={`bp5-popover-content${darkMode ? ' bp5-dark' : ''}`} style={{ width: '100%', minWidth: 200, maxWidth: 400, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: 12 }}>
        <H6 style={{ flex: 1, margin: 0, color: darkMode ? undefined : '#222' }}>Profiling</H6>
        <Button minimal icon={<Icon icon="cross" />} onClick={onClose} style={{ marginLeft: 4 }} />
        <Button minimal icon={<Icon icon="plus" />} onClick={onToggleCompact} style={{ marginLeft: 4 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        {allKeys.length === 0 && <span className="bp5-text-muted" style={{ color: darkMode ? undefined : '#222' }}>No benchmarks yet</span>}
        {allKeys.map(key => (
          <Button
            key={key}
            small
            outlined
            active={selectedKey === key}
            onClick={() => setSelectedKey(key)}
            style={{ marginRight: 4, marginBottom: 4 }}
          >
            {key}
          </Button>
        ))}
      </div>
      {/* Time-series plot */}
      {isTimeSeries && (
        tsSamples.length === 0 ? (
          <span className="bp5-text-muted" style={{ color: darkMode ? undefined : '#222' }}>No data yet.</span>
        ) : (
          <div style={{ position: 'relative', width: 280, height: 80 }}>
            <WindowedTimeSeriesPlot
              yValues={tsSamples.map(s => s.value)}
              windowStart={0}
              windowDuration={tsSamples.length}
              width={280}
              height={60}
              color={darkMode ? '#48aff0' : '#106ba3'}
              showAxes={false}
              showTicks={false}
            />
            {/* Overlay for hover tooltips */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: 280, height: 60, pointerEvents: 'auto' }}
              onMouseMove={e => {
                const rect = (e.target as HTMLDivElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const idx = Math.round((x / 280) * (tsSamples.length - 1));
                setHoverIdx(idx >= 0 && idx < tsSamples.length ? idx : null);
              }}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {hoverIdx !== null && tsSamples[hoverIdx] && (
                <div style={{
                  position: 'absolute',
                  left: Math.min(hoverIdx / (tsSamples.length - 1) * 280, 220),
                  top: 8,
                  background: darkMode ? '#222' : '#fff',
                  color: darkMode ? '#fff' : '#222',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 13,
                  pointerEvents: 'none',
                  zIndex: 10,
                  boxShadow: '0 2px 8px #0008',
                }}>
                  <div><b>{tsSamples[hoverIdx].label}</b></div>
                  <div>Value: {tsSamples[hoverIdx].value.toFixed(2)}</div>
                  {tsSamples[hoverIdx].meta != null && (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Meta: {String(tsSamples[hoverIdx].meta)}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      )}
      {/* One-off bar */}
      {isOneOff && (
        !oneOffSample ? (
          <span className="bp5-text-muted" style={{ color: darkMode ? undefined : '#222' }}>No data yet.</span>
        ) : (
          <div style={{ width: 280, height: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: Math.min(240, oneOffSample.value * 2), height: 18, background: darkMode ? '#48aff0' : '#106ba3', borderRadius: 6 }} />
            <div style={{ fontSize: 14 }}>{oneOffSample.value.toFixed(2)}</div>
            {oneOffSample.label && <div style={{ fontSize: 13, color: darkMode ? '#aaa' : '#222' }}>{oneOffSample.label}</div>}
            {oneOffSample.meta != null && (
              <div style={{ fontSize: 12, color: darkMode ? '#aaa' : '#222', opacity: 0.7 }}>Meta: {String(oneOffSample.meta)}</div>
            )}
          </div>
        )
      )}
    </div>
  );
}; 