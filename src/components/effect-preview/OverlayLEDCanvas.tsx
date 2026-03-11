import { useRef, useEffect, useState } from "react";
import {
    createPulsePlayerAPI,
    SIMULATION_DT,
    type CanvasEffect,
} from "../../wasm/playersModule";
import { StripArrangement } from "./LEDs";

const LAMP_SIZE = 4;
const GAP = 2;
const STRIP_LENGTH = 250;

export function OverlayLEDCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ready, setReady] = useState(false);
    const effectRef = useRef<CanvasEffect | null>(null);
    const arrangementRef = useRef<StripArrangement | null>(null);
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
                effectRef.current = api;
                arrangementRef.current = new StripArrangement(
                    STRIP_LENGTH,
                    LAMP_SIZE,
                    GAP,
                    "row",
                    "transparent"
                );
                api.init(STRIP_LENGTH, 0, 200, 255, 12, 50, true);
                api.start();
                setReady(true);
            } catch {
                // ignore for overlay; page still works
            }
        })();
        return () => {
            cancelled = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            effectRef.current?.dispose();
            effectRef.current = null;
            arrangementRef.current = null;
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        return () => window.removeEventListener("resize", resize);
    }, []);

    useEffect(() => {
        if (!ready || !canvasRef.current || !effectRef.current || !arrangementRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const effect = effectRef.current;
        const arrangement = arrangementRef.current;
        const maxAccumulated = 0.1;

        const draw = (now: number) => {
            if (canvas.width === 0 || canvas.height === 0) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }
            const lastTime = lastTimeRef.current;
            const realDt = lastTime ? (now - lastTime) / 1000 : SIMULATION_DT;
            lastTimeRef.current = now;

            let acc = accumulatorRef.current + realDt;
            if (acc > maxAccumulated) acc = maxAccumulated;

            while (acc >= SIMULATION_DT) {
                effect.clearBuffer();
                const stillPlaying = effect.update(SIMULATION_DT);
                if (stillPlaying === false && effect.restart) effect.restart();
                acc -= SIMULATION_DT;
            }
            accumulatorRef.current = acc;

            // Clear overlay to transparent, then draw strip at top
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const buf = new Uint8Array(effect.getBufferView());
            ctx.save();
            ctx.translate(0, 0);
            arrangement.render(ctx, buf);
            ctx.restore();

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [ready]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 1,
            }}
            aria-hidden
        />
    );
}
