import React from "react";
import { useAppStore } from "../../store/appStore";
import { Stage, Layer } from "react-konva";
import { ResponseRect } from "./ResponseRect";

const rectWidth = 100;
const rectHeight = 32;

export const ResponseTypeDragBar: React.FC = () => {
  const palettes = useAppStore(state => state.palettes);

  const handleDragStart = (e: React.DragEvent, paletteName: string) => {
    e.dataTransfer.setData("application/x-palette-type", paletteName);
    // Optionally: add a drag image
    // e.dataTransfer.setDragImage(...)
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 24,
      alignItems: 'center',
      padding: '12px 0',
      background: 'transparent',
      borderBottom: '1.5px solid #222',
      marginBottom: 12,
      overflowX: 'auto',
    }}>
      {Object.entries(palettes).map(([paletteName, pal]) => (
        <div
          key={paletteName}
          draggable
          onDragStart={e => handleDragStart(e, paletteName)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'grab',
            userSelect: 'none',
            minWidth: rectWidth + 8,
          }}
        >
          <Stage width={rectWidth} height={rectHeight + 8} style={{ background: 'none' }}>
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
          <div style={{ color: '#fff', fontSize: 15, marginTop: 6, textAlign: 'center', fontWeight: 500 }}>
            {paletteName.charAt(0).toUpperCase() + paletteName.slice(1)}
          </div>
        </div>
      ))}
    </div>
  );
}; 