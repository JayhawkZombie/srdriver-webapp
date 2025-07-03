import React, { useRef, useLayoutEffect, useState } from "react";

interface SvgVisualizationWrapperProps {
  children: (size: { width: number; height: number }) => React.ReactNode;
  className?: string;
  minHeight?: number;
  minWidth?: number;
  maxHeight?: number;
  maxWidth?: number;
  aspectRatio?: number; // width / height
  borderRadius?: number;
  padding?: number | string;
  style?: React.CSSProperties;
}

export const SvgVisualizationWrapper: React.FC<SvgVisualizationWrapperProps> = ({
  children,
  className,
  minHeight = 80,
  minWidth = 120,
  maxHeight = 400,
  maxWidth = 1200,
  aspectRatio,
  borderRadius = 12,
  padding = 0,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: minWidth, height: minHeight });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const handleResize = () => {
      if (!ref.current) return;
      let width = ref.current.offsetWidth;
      let height = ref.current.offsetHeight;
      if (aspectRatio) {
        // Adjust height to maintain aspect ratio
        height = width / aspectRatio;
      }
      width = Math.max(minWidth, Math.min(width, maxWidth));
      height = Math.max(minHeight, Math.min(height, maxHeight));
      setSize({ width, height });
    };
    handleResize();
    const ro = new window.ResizeObserver(handleResize);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [aspectRatio, minWidth, minHeight, maxWidth, maxHeight]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        borderRadius,
        overflow: 'hidden',
        padding,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children(size)}
    </div>
  );
}; 