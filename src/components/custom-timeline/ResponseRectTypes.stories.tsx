import React from "react";
import { Stage, Layer } from "react-konva";
import { Card } from "@blueprintjs/core";
import { ResponseRect } from "./ResponseRect";
import { useAppStore } from "../../store/appStore";

export default {
  title: "Timeline/ResponseRectTypes",
  component: ResponseRect,
};

const rectWidth = 120;
const rectHeight = 32;

export const Gallery = () => {
  const palettes = useAppStore(state => state.palettes);
  return (
      <div style={{ background: "#222", padding: 32, borderRadius: 12, minWidth: 400, maxWidth: 1200 }}>
        <h3 style={{ color: '#fff', margin: '16px 0 24px 0', fontWeight: 600 }}>Response Rect Types Gallery</h3>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(4, 1fr)`, gap: 32, justifyItems: "center", alignItems: "start" }}>
          {Object.entries(palettes).map(([paletteName, pal]) => (
            <Card key={paletteName} style={{ background: '#181c22', padding: 16, borderRadius: 10, boxShadow: '0 2px 8px #0004', margin: 4, minWidth: 160 }}>
              <Stage width={rectWidth} height={rectHeight + 8} style={{ background: "none" }}>
                <Layer>
                  <ResponseRect
                    x={0}
                    y={4}
                    width={rectWidth}
                    height={rectHeight}
                    color={pal.baseColor}
                    borderColor={pal.borderColor}
                  />
                </Layer>
              </Stage>
              <div style={{ color: "#fff", fontSize: 15, marginTop: 12, textAlign: "center" }}>{paletteName.charAt(0).toUpperCase() + paletteName.slice(1)}</div>
            </Card>
          ))}
        </div>
      </div>
  );
}; 