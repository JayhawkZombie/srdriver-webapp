import { useRef, useEffect, useState } from "react";
import { Paper, Title, Text } from "@mantine/core";
import {
    createPulsePlayerAPI,
    ROWS,
    COLS,
    SIMULATION_DT,
    type CanvasEffect,
} from "../../wasm/playersModule";
import { MatrixArrangement } from "./LEDs";

const LAMP_SIZE = 10;
const GAP = 10;
const arrangement = new MatrixArrangement(ROWS, COLS, LAMP_SIZE, GAP, "#1a1a2e");

export function EffectPreviewCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const apiRef = useRef<CanvasEffect | null>(null);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const accumulatorRef = useRef<number>(0);

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

        const maxAccumulated = 0.1; // cap to avoid spiral of death

        const draw = (now: number) => {
            const api = apiRef.current;
            if (!api) return;

            const lastTime = lastTimeRef.current;
            const realDt = lastTime ? (now - lastTime) / 1000 : SIMULATION_DT;
            lastTimeRef.current = now;

            let acc = accumulatorRef.current + realDt;
            if (acc > maxAccumulated) acc = maxAccumulated;

            while (acc >= SIMULATION_DT) {
                api.clearBuffer();
                const stillPlaying = api.update(SIMULATION_DT);
                if (stillPlaying === false && api.restart) api.restart();
                acc -= SIMULATION_DT;
            }
            accumulatorRef.current = acc;

            const buf = new Uint8Array(api.getBufferView());
            arrangement.render(ctx, buf);

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
                width={arrangement.width}
                height={arrangement.height}
                style={{ display: "block", borderRadius: 4 }}
            />
        </Paper>
    );
}
