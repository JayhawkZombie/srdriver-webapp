import React from "react";
import type { RectTemplate } from "../../store/appStore";

interface KonvaTimelineTemplateSelectorProps {
  rectTemplates: Record<string, RectTemplate>;
  selectedTemplateKey: string;
  onSelect: (key: string) => void;
}

const rectStyle = (color: string, selected: boolean) => ({
  width: 48,
  height: 32,
  borderRadius: 6,
  margin: "0 8px",
  background: color,
  border: selected ? "3px solid #FFD600" : "2px solid #444",
  boxShadow: selected ? "0 0 8px #FFD60088" : undefined,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "border 0.2s, box-shadow 0.2s"
});

const labelStyle = (selected: boolean) => ({
  marginTop: 4,
  textAlign: "center" as const,
  color: selected ? "#FFD600" : "#fff",
  fontWeight: 600,
  fontSize: 13,
  textShadow: "0 1px 4px #000, 0 0px 2px #000",
  letterSpacing: 0.5,
  userSelect: "none" as const,
});

export const KonvaTimelineTemplateSelector: React.FC<KonvaTimelineTemplateSelectorProps> = ({
  rectTemplates,
  selectedTemplateKey,
  onSelect,
}) => {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 24, margin: "0 0 18px 0" }}>
      {Object.entries(rectTemplates).map(([key, template]) => {
        const color = template?.defaultData?.color || "#2196f3";
        const selected = selectedTemplateKey === key;
        return (
          <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={rectStyle(color, selected)}
              onClick={() => onSelect(key)}
              title={template?.type || key}
            />
            <div style={labelStyle(selected)}>
              {template?.type || key}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KonvaTimelineTemplateSelector; 