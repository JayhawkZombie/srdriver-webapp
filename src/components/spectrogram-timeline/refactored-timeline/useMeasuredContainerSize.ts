import { useRef, useState, useLayoutEffect } from "react";

interface MeasuredContainerOptions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number; // width / height
}

export function useMeasuredContainerSize(options: MeasuredContainerOptions = {}) {
  const {
    minWidth = 0,
    minHeight = 0,
    maxWidth = Infinity,
    maxHeight = Infinity,
    aspectRatio,
  } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: minWidth, height: minHeight });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const handleResize = () => {
      if (!ref.current) return;
      let width = ref.current.offsetWidth;
      let height = ref.current.offsetHeight;
      if (aspectRatio) height = width / aspectRatio;
      width = Math.max(minWidth, Math.min(width, maxWidth));
      height = Math.max(minHeight, Math.min(height, maxHeight));
      setSize({ width, height });
    };
    handleResize();
    const ro = new window.ResizeObserver(handleResize);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [aspectRatio, minWidth, minHeight, maxWidth, maxHeight]);

  return [ref, size] as const;
} 