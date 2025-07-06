import React from "react";
import Dashboard from "./components/Dashboard";
import { DeviceControllerProvider } from "./controllers/DeviceControllerContext";
import { ToastProvider } from "./controllers/ToastContext";
import GlobalToast from "./components/GlobalToast";
import { UnifiedThemeProvider } from "./context/UnifiedThemeProvider";
import { UnifiedThemeContext } from "./context/UnifiedThemeContext";
// @ts-expect-error - no types for blueprintjs direct css imports
import "@blueprintjs/core/lib/css/blueprint.css";

const App = () => {
    return (
        <UnifiedThemeProvider>
                    <DeviceControllerProvider>
                        <ToastProvider>
                            <GlobalToast />
                    <UnifiedThemeContext.Consumer>
                        {(value) => {
                            if (!value) return null;
                            const { mode, toggleMode } = value;
                            return <Dashboard mode={mode} onToggleMode={toggleMode} />;
                        }}
                    </UnifiedThemeContext.Consumer>
                        </ToastProvider>
                    </DeviceControllerProvider>
        </UnifiedThemeProvider>
    );
};

export default App;
