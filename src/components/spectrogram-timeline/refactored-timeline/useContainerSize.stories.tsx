import React, { useState } from "react";
import { useContainerSize } from "./useContainerSize";

export default {
  title: "RefactoredTimeline/useContainerSize",
};

const SizeDisplayBox: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const [ref, { width, height }] = useContainerSize();
  return (
    <div
      ref={ref}
      style={{
        background: '#e0e0e0',
        padding: 0,
        height: "100%",
        width: "100%",
        fontSize: 18,
        textAlign: 'center',
        ...style,
      }}
    >
      Width: {Math.round(width)}px<br />
      Height: {Math.round(height)}px
    </div>
  );
};

export const Static = () => (
  <div style={{ width: "300px", height: "100px", margin: '2rem auto' }}>
    <SizeDisplayBox />
  </div>
);

export const DynamicWidth = () => {
  const [parentWidth, setParentWidth] = useState(300);
  return (
    <div style={{ width: 400, height: 100, margin: '2rem auto' }}>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Parent width: {parentWidth}px
      </label>
      <input
        type="range"
        min={100}
        max={400}
        value={parentWidth}
        onChange={e => setParentWidth(Number(e.target.value))}
        style={{ width: 200, marginBottom: 16 }}
      />
      <div style={{ width: parentWidth, transition: 'width 0.2s', margin: '0 auto' }}>
        <SizeDisplayBox />
      </div>
    </div>
  );
};

export const DynamicHeight = () => {
  const [parentHeight, setParentHeight] = useState(80);
  return (
    <div style={{ width: 300, margin: '2rem auto' }}>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Parent height: {parentHeight}px
      </label>
      <input
        type="range"
        min={40}
        max={200}
        value={parentHeight}
        onChange={e => setParentHeight(Number(e.target.value))}
        style={{ width: 200, marginBottom: 16 }}
      />
      <div style={{ height: parentHeight, transition: 'height 0.2s', margin: '0 auto' }}>
        <SizeDisplayBox />
      </div>
    </div>
  );
};
