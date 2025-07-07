import React, { useState } from "react";
import { useMeasuredContainerSize } from "./useMeasuredContainerSize";

export default {
  title: "RefactoredTimeline/useMeasuredContainerSize",
};

const SizeDisplayBox: React.FC<{
  options?: Parameters<typeof useMeasuredContainerSize>[0];
  style?: React.CSSProperties;
  label?: string;
}> = ({ options, style, label }) => {
  const [ref, { width, height }] = useMeasuredContainerSize(options);
  return (
    <div
      ref={ref}
      style={{
        background: '#e0e0e0',
        width: '100%',
        height: '100%',
        fontSize: 16,
        textAlign: 'center',
        ...style,
      }}
    >
      {label && <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      Width: {Math.round(width)}px<br />
      Height: {Math.round(height)}px
    </div>
  );
};

const parentStyle = {
  border: '2px dashed #1976d2',
  background: '#e3f2fd',
  position: 'relative' as const,
  margin: '2rem auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const parentLabelStyle = {
  position: 'absolute' as const,
  top: -24,
  left: 0,
  fontSize: 13,
  color: '#1976d2',
  fontWeight: 600,
};

export const StaticMinMax = () => (
  <div style={{ ...parentStyle, width: 300, height: 120 }}>
    <span style={parentLabelStyle}>Parent: 300x120px</span>
    <SizeDisplayBox options={{ minWidth: 200, minHeight: 80, maxWidth: 400, maxHeight: 200 }} label="minWidth:200, minHeight:80, maxWidth:400, maxHeight:200" />
  </div>
);

export const DynamicWidthHeight = () => {
  const [parentWidth, setParentWidth] = useState(300);
  const [parentHeight, setParentHeight] = useState(100);
  return (
    <div style={{ width: 400, margin: '2rem auto' }}>
      <label>Width: {parentWidth}px</label>
      <input type="range" min={100} max={400} value={parentWidth} onChange={e => setParentWidth(Number(e.target.value))} style={{ width: 200, margin: '0 8px' }} />
      <label>Height: {parentHeight}px</label>
      <input type="range" min={40} max={200} value={parentHeight} onChange={e => setParentHeight(Number(e.target.value))} style={{ width: 200, margin: '0 8px' }} />
      <div style={{ ...parentStyle, width: parentWidth, height: parentHeight }}>
        <span style={parentLabelStyle}>Parent: {parentWidth}x{parentHeight}px</span>
        <SizeDisplayBox />
      </div>
    </div>
  );
};

export const AspectRatio = () => {
  const [parentWidth, setParentWidth] = useState(300);
  return (
    <div style={{ width: 400, margin: '2rem auto' }}>
      <label>Width: {parentWidth}px</label>
      <input type="range" min={100} max={400} value={parentWidth} onChange={e => setParentWidth(Number(e.target.value))} style={{ width: 200, margin: '0 8px' }} />
      <div style={{ ...parentStyle, width: parentWidth, height: 200, background: '#c8e6c9', border: '2px dashed #388e3c' }}>
        <span style={{ ...parentLabelStyle, color: '#388e3c' }}>Parent: {parentWidth}x200px</span>
        <SizeDisplayBox options={{ aspectRatio: 2 }} label="aspectRatio: 2 (width/height)" />
      </div>
    </div>
  );
};

export const NestedContainers = () => (
  <div style={{ ...parentStyle, width: 350, height: 180, background: '#ffe082', border: '2px dashed #fbc02d', padding: 12 }}>
    <span style={{ ...parentLabelStyle, color: '#fbc02d' }}>Parent: 350x180px</span>
    <SizeDisplayBox label="Outer" style={{ background: '#fffde7', height: '100%' }} />
    <div style={{ width: '80%', height: '60%', margin: '0 auto', background: '#b2dfdb', border: '2px dashed #00796b', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ ...parentLabelStyle, color: '#00796b' }}>Inner Parent: 80%x60%</span>
      <SizeDisplayBox label="Inner" style={{ background: '#e0f2f1' }} />
    </div>
  </div>
);

export const EdgeCases = () => (
  <div style={{ ...parentStyle, width: 80, height: 30, background: '#ffcdd2', border: '2px dashed #b71c1c' }}>
    <span style={{ ...parentLabelStyle, color: '#b71c1c' }}>Parent: 80x30px</span>
    <SizeDisplayBox options={{ minWidth: 100, minHeight: 50, maxWidth: 120, maxHeight: 60, aspectRatio: 2 }} label="minW:100, minH:50, maxW:120, maxH:60, aspect:2" style={{ background: '#fff' }} />
  </div>
); 