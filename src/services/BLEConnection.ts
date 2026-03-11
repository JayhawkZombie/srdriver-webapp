export class BLEConnection {
	private device: BluetoothDevice | null = null;
	private server: BluetoothRemoteGATTServer | null = null;
	private service: BluetoothRemoteGATTService | null = null;

	async connect(): Promise<void> {
		try {
			// Request device
			this.device = await navigator.bluetooth.requestDevice({
				filters: [{ namePrefix: "SRDriver" }, { namePrefix: "srdriver" }],
				optionalServices: ["b1862b70-e0ce-4b1b-9734-d7629eb8d711"], // SRDriver service
			});

			// Connect to GATT server
			this.server = (await this.device.gatt?.connect()) || null;
			if (!this.server) {
				throw new Error("Failed to connect to GATT server");
			}

			// Get the service
			this.service = await this.server.getPrimaryService("b1862b70-e0ce-4b1b-9734-d7629eb8d711");

			console.log("✅ Connected to SRDriver device");
		} catch (error) {
			console.error("❌ BLE connection failed:", error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		if (this.server) {
			this.server.disconnect();
		}
		this.device = null;
		this.server = null;
		this.service = null;
		console.log("📱 Disconnected from SRDriver device");
	}

	isConnected(): boolean {
		return this.server?.connected || false;
	}

	getService(): BluetoothRemoteGATTService | null {
		return this.service;
	}

	getDeviceId(): string {
		return this.device?.id || "unknown";
	}
}
