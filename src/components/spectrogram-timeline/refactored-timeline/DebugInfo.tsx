import React from "react";

export interface DebugInfoProps {
  data: any;
  label?: string;
  collapsed?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({
  data,
  label,
  collapsed = false,
  style,
  className,
}) => {
  const [open, setOpen] = React.useState(!collapsed);
  return (
    <div
      className={className}
      style={{
        background: "#181c22",
        color: "#fffde7",
        fontSize: 13,
        padding: 12,
        borderRadius: 8,
        margin: "12px auto",
        maxWidth: 800,
        overflowX: "auto",
        fontFamily: "monospace",
        ...style,
      }}
    >
      {label && (
        <div
          style={{
            fontWeight: "bold",
            marginBottom: 4,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => setOpen((o) => !o)}
        >
          {label} {open ? "▼" : "▶"}
        </div>
      )}
      {open && <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};

export default DebugInfo; 