import { useRef, useEffect, useState } from "react";
import { Paper, Title, Text } from "@mantine/core";
import {
    createPulsePlayerAPI,
    ROWS,
    COLS,
    type PulsePlayerAPI,
} from "../../wasm/playersModule";

const CELL_SIZE = 10; // pixels per LED
const CANVAS_WIDTH = COLS * CELL_SIZE;
const CANVAS_HEIGHT = ROWS * CELL_SIZE;

export function EffectPreviewCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const apiRef = useRef<PulsePlayerAPI | null>(null);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const api = await createPulsePlayerAPI();
                if (cancelled) {
                    api.dispose();
                    return;
                }
                apiRef.current = api;

                api.init(16 * 16, 0, 200, 255, 80, 40, true);
                api.start();

                setReady(true);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            }
        })();

        return () => {
            cancelled = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            apiRef.current?.dispose();
            apiRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!ready || !canvasRef.current || !apiRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const draw = (now: number) => {
            const api = apiRef.current;
            if (!api) return;

            const dt = 0.016;// lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 1 / 60;
            lastTimeRef.current = now;

            api.clearBuffer();
            api.update(dt);
            // if (!api.update(dt)) api.start();
            const buf = new Uint8Array(api.getBufferView());

            const imageData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
            imageData.data.fill(0);
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const i = (r * COLS + c) * 3;
                    const px = c * CELL_SIZE;
                    const py = r * CELL_SIZE;
                    for (let dy = 0; dy < CELL_SIZE; dy++) {
                        for (let dx = 0; dx < CELL_SIZE; dx++) {
                            const out = ((py + dy) * CANVAS_WIDTH + (px + dx)) * 4;
                            imageData.data[out] = buf[i];
                            imageData.data[out + 1] = buf[i + 1];
                            imageData.data[out + 2] = buf[i + 2];
                            imageData.data[out + 3] = 255;
                        }
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [ready]);

    if (error) {
        return (
            <Paper p="md" withBorder>
                <Title order={4}>Effect preview (WASM)</Title>
                <Text c="red" size="sm" mt="xs">
                    {error}
                </Text>
            </Paper>
        );
    }

    return (
        <Paper p="md" withBorder>
            <Title order={4}>Effect preview (WASM)</Title>
            <Text size="sm" c="dimmed" mb="xs">
                Pulse player — same C++ as device
            </Text>
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{ display: "block", borderRadius: 4 }}
            />
        </Paper>
    );
}
