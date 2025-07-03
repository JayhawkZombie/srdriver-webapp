import React from "react";

interface TimelineContextMenuProps {
  x: number;
  y: number;
  info: any;
  onClose: () => void;
}

const TimelineContextMenu: React.FC<TimelineContextMenuProps> = ({ x, y, info, onClose }) => (
  <div
    style={{
      position: "fixed",
      left: x,
      top: y,
      background: "#23272f",
      color: "#fffde7",
      border: "1px solid #444",
      borderRadius: 6,
      padding: "10px 18px",
      zIndex: 1000,
      boxShadow: "0 2px 12px #000a",
      fontFamily: "monospace",
      fontSize: 15,
      minWidth: 220,
    }}
  >
    <div style={{ fontWeight: "bold", marginBottom: 6 }}>Timeline Context Menu</div>
    <div>Time: {info?.time?.toFixed(2)}</div>
    <div>Track: {info?.trackIndex}</div>
    {info?.responseId && <div>Response ID: {info.responseId}</div>}
    {/* Add more actions here */}
    <div style={{ marginTop: 10, color: "#00e5ff", cursor: "pointer" }} onClick={onClose}>
      Close
    </div>
  </div>
);

export default TimelineContextMenu; 