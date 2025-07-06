import React from "react";
import { DeviceControllerProvider } from "../controllers/DeviceControllerContext";
import { useAppStore } from "../store/appStore";

// Minimal fake device list
const fakeDevices = [
  { browserId: "dev1", name: "Fake Device 1", isConnected: true, nickname: "", group: null, tags: [], typeInfo: { model: "A", firmwareVersion: "1.0", numLEDs: 30, ledLayout: "strip" as const, capabilities: [] } },
  { browserId: "dev2", name: "Fake Device 2", isConnected: true, nickname: "", group: null, tags: [], typeInfo: { model: "B", firmwareVersion: "1.0", numLEDs: 60, ledLayout: "strip" as const, capabilities: [] } },
];

function useInjectFakeDevices() {
  React.useEffect(() => {
    useAppStore.setState({
      devices: fakeDevices.map(d => d.browserId),
      deviceMetadata: Object.fromEntries(fakeDevices.map(d => [d.browserId, d])),
    });
  }, []);
}

export const FakeDeviceControllerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useInjectFakeDevices();
  return <DeviceControllerProvider>{children}</DeviceControllerProvider>;
}; 