import React, { useState } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Dashboard from "./components/Dashboard";
import { DeviceControllerProvider } from "./controllers/DeviceControllerContext";
import { ToastProvider } from "./controllers/ToastContext";
import GlobalToast from "./components/GlobalToast";

// @ts-expect-error - no types for blueprintjs direct css imports
import "@blueprintjs/core/lib/css/blueprint.css";

function App() {
    const getInitialMode = () => {
        const saved = localStorage.getItem("colorMode");
        if (saved === "light" || saved === "dark") return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    };
    const [mode, setMode] = useState<"light" | "dark">(getInitialMode());
    const theme = createTheme({ palette: { mode } });
    const handleToggle = () => {
        setMode((prev) => {
            const next = prev === "light" ? "dark" : "light";
            localStorage.setItem("colorMode", next);
            return next;
        });
    };

    return (
        <>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                    <DeviceControllerProvider>
                        <ToastProvider>
                            <GlobalToast />
                            <Dashboard
                                mode={mode}
                                onToggleMode={handleToggle}
                            />
                        </ToastProvider>
                    </DeviceControllerProvider>
            </ThemeProvider>
        </>
    );
}

export default App;
