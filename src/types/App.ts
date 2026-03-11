export interface Device { }

export interface PersistedDeviceInfo {
	id: string; // Unique device identifier - BLE device ID or IP address
	ipAddress: string | null; // For WebSocket connections
	connectionType: "ble" | "websocket";
	lastConnected: string; // ISO date string for serialization
	name?: string; // Optional custom name
}
