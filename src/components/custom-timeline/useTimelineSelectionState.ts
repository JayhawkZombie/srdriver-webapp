import { useState } from "react";

export const useTimelineSelectionState = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return { hoveredId, setHoveredId, selectedId, setSelectedId };
}; 