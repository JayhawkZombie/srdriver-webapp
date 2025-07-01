import React, { useRef, useEffect } from "react";

type UnderlayType = "None" | "Waveform" | "Frequency";

interface UnderlayCanvasProps {
    type: UnderlayType;
    width: number;
    height: number;
    audioData?: Float32Array | number[]; // for future real data
}

const UnderlayCanvas: React.FC<UnderlayCanvasProps> = ({
    type,
    width,
    height,
    audioData,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (type === "Waveform") {
            ctx.strokeStyle = "#90caf9";
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (audioData && audioData.length > 0) {
                // Draw real waveform
                for (let x = 0; x < width; x++) {
                    const idx = Math.floor((x / width) * audioData.length);
                    const y = height / 2 - (audioData[idx] || 0) * (height / 2);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
            } else {
                // Draw mock sine wave
                for (let x = 0; x < width; x++) {
                    const t = (x / width) * 4 * Math.PI;
                    const y = height / 2 + Math.sin(t) * (height / 3);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        } else if (type === "Frequency") {
            const bands = 8;
            for (let i = 0; i < bands; i++) {
                let barHeight;
                if (audioData && audioData.length >= bands) {
                    barHeight = Math.abs(audioData[i]) * (height * 0.7);
                } else {
                    barHeight = Math.abs(Math.sin(i + 1)) * (height * 0.7);
                }
                ctx.fillStyle = `rgba(144,202,249,${0.3 + 0.5 * (i % 2)})`;
                ctx.fillRect(
                    (width / bands) * i + 4,
                    height - barHeight - 6,
                    width / bands - 8,
                    barHeight
                );
            }
        }
    }, [type, width, height, audioData]);

    if (type === "None") return null;
    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width,
                height,
                zIndex: 0,
                opacity: 0.35,
                pointerEvents: "none",
                borderRadius: 8,
                overflow: "hidden",
            }}
        />
    );
};

export default UnderlayCanvas;
