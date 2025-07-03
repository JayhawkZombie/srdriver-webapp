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

export const StaticMinMax = () => (
  <div style={{ width: 300, height: 120, margin: '2rem auto' }}>
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
      <div style={{ width: parentWidth, height: parentHeight, margin: '1rem auto', background: '#b3e5fc' }}>
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
      <div style={{ width: parentWidth, height: 200, margin: '1rem auto', background: '#c8e6c9' }}>
        <SizeDisplayBox options={{ aspectRatio: 2 }} label="aspectRatio: 2 (width/height)" />
      </div>
    </div>
  );
};

export const NestedContainers = () => (
  <div style={{ width: 350, height: 180, margin: '2rem auto', background: '#ffe082', padding: 12 }}>
    <SizeDisplayBox label="Outer" style={{ background: '#fffde7', height: '100%' }} />
    <div style={{ width: '80%', height: '60%', margin: '0 auto', background: '#b2dfdb' }}>
      <SizeDisplayBox label="Inner" style={{ background: '#e0f2f1' }} />
    </div>
  </div>
);

export const EdgeCases = () => (
  <div style={{ width: 80, height: 30, margin: '2rem auto', background: '#ffcdd2' }}>
    <SizeDisplayBox options={{ minWidth: 100, minHeight: 50, maxWidth: 120, maxHeight: 60, aspectRatio: 2 }} label="minW:100, minH:50, maxW:120, maxH:60, aspect:2" />
  </div>
); 