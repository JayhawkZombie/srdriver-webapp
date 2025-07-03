import React from "react";
import type { CSSProperties } from "react";
import styles from "./SvgVisualizationWrapper.module.css";
import { useMeasuredContainerSize } from "./useMeasuredContainerSize";

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
  style?: CSSProperties;
}

export const SvgVisualizationWrapper: React.FC<SvgVisualizationWrapperProps> = ({
  children,
  className = "",
  minHeight = 80,
  minWidth = 120,
  maxHeight = 400,
  maxWidth = 1200,
  aspectRatio,
  borderRadius = 12,
  padding = 0,
  style = {},
}) => {
  const [ref, size] = useMeasuredContainerSize({ minWidth, minHeight, maxWidth, maxHeight, aspectRatio });

  const wrapperStyle: CSSProperties = {
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    borderRadius,
    padding,
    ...style,
  };

  return (
    <div
      ref={ref}
      className={`${styles.svgVisRoot} ${className}`.trim()}
      style={wrapperStyle}
    >
      {children(size)}
    </div>
  );
}; 