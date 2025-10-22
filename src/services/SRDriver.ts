import { BLEConnection } from './BLEConnection';

export interface CommunicationLog {
  id: string;
  deviceId: string;
  timestamp: Date;
  direction: 'in' | 'out';
  method: 'ble' | 'websocket';
  command: string;
  success: boolean;
  error?: string;
  duration?: number;
  extraTags?: string[];
}

export class SRDriver {
  private bleConnection: BLEConnection | null = null;
  private brightnessCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private ipAddressCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private wifiSSIDCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private wifiPasswordCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private wifiStatusCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  
  // WebSocket connection
  private wsConnection: WebSocket | null = null;
  private wsIP: string | null = null;
  
  // Communication logging
  private onCommunicationLog?: (log: CommunicationLog) => void;

  constructor(bleConnection?: BLEConnection) {
    this.bleConnection = bleConnection || null;
  }
  
  // Set communication logging callback
  setCommunicationLogger(callback: (log: CommunicationLog) => void) {
    console.log('📱 Setting communication logger');
    this.onCommunicationLog = callback;
  }

  async initialize(): Promise<void> {
    if (!this.bleConnection) {
      console.log('📱 No BLE connection provided, WebSocket-only mode');
      return;
    }
    
    const service = this.bleConnection.getService();
    if (!service) {
      throw new Error('No BLE service available');
    }

    // Get brightness characteristic
    this.brightnessCharacteristic = await service.getCharacteristic('4df3a1f9-2a42-43ee-ac96-f7db09abb4f0');
    
    // Get command characteristic (pattern index characteristic that accepts JSON)
    this.commandCharacteristic = await service.getCharacteristic(
        "c1862b70-e0ce-4b1b-9734-d7629eb8d712"
    );
    
    // Get IP address characteristic (optional for older devices)
    try {
        this.ipAddressCharacteristic = await service.getCharacteristic(
            "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        );
        console.log('📱 IP address characteristic found');
    } catch (error) {
        console.log('📱 IP address characteristic not found (older device)');
        this.ipAddressCharacteristic = null;
    }
    
    // Get WiFi characteristics (optional for older devices)
    try {
        console.log('📱 Attempting to get WiFi SSID characteristic...');
        this.wifiSSIDCharacteristic = await service.getCharacteristic(
            "04a1d69b-efbc-4919-9b61-b557bdafeb8a"
        );
        console.log('📱 WiFi SSID characteristic found');
        
        console.log('📱 Attempting to get WiFi Password characteristic...');
        this.wifiPasswordCharacteristic = await service.getCharacteristic(
            "21308ad6-e818-41fa-a81f-c5995cc938ac"
        );
        console.log('📱 WiFi Password characteristic found');
        
        console.log('📱 Attempting to get WiFi Status characteristic...');
        this.wifiStatusCharacteristic = await service.getCharacteristic(
            "f3d6b6b2-a507-413f-9d41-952fbe3cc494"
        );
        console.log('📱 WiFi Status characteristic found');
        
        console.log('📱 All WiFi characteristics found');
    } catch (error) {
        console.log('📱 WiFi characteristics not found (older device):', error);
        this.wifiSSIDCharacteristic = null;
        this.wifiPasswordCharacteristic = null;
        this.wifiStatusCharacteristic = null;
    }
    
    console.log('📱 SRDriver initialized');
  }

  getDeviceId(): string {
    return this.wsIP || this.bleConnection?.getDeviceId() || 'unknown';
  }

  async setBrightness(brightness: number): Promise<void> {
    const startTime = performance.now();
    let method: 'ble' | 'websocket' = 'ble';
    let success = false;
    let error: string | undefined;
    
    try {
      if (this.isWebSocketConnected()) {
        method = 'websocket';
        await this.sendWebSocketCommand({ brightness });
        success = true;
      } else if (this.brightnessCharacteristic) {
        method = 'ble';
        const value = brightness.toString();
        const buffer = new TextEncoder().encode(value);
        await this.brightnessCharacteristic.writeValue(buffer);
        success = true;
      } else {
        throw new Error('No connection available for brightness control');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      this.onCommunicationLog?.({
        id: `log-${Date.now()}-${Math.random()}`,
        deviceId: this.getDeviceId(),
        timestamp: new Date(),
        direction: 'out',
        method,
        command: `setBrightness(${brightness})`,
        success,
        error,
        duration: performance.now() - startTime
      });
    }
  }

  async getBrightness(): Promise<number> {
    if (!this.brightnessCharacteristic) {
      throw new Error('Brightness characteristic not available');
    }

    const data = await this.brightnessCharacteristic.readValue();
    const value = new TextDecoder().decode(data);
    const brightness = parseInt(value, 10);
    console.log(`📱 Read brightness: ${brightness}`);
    return brightness;
  }

  async connectBLE(): Promise<void> {
    if (!this.bleConnection) {
      this.bleConnection = new BLEConnection();
    }
    await this.bleConnection.connect();
    await this.initialize();
  }

  async sendCommand(command: string): Promise<void> {
    const startTime = performance.now();
    let method: 'ble' | 'websocket' = 'ble';
    let success = false;
    let error: string | undefined;
    
    try {
      // Try WebSocket first if connected
      if (this.isWebSocketConnected()) {
        method = 'websocket';
        const commandObj = JSON.parse(command);
        await this.sendWebSocketCommand(commandObj);
        console.log(`📱 Sent command via WebSocket: ${command}`);
        success = true;
      } else if (this.bleConnection && this.commandCharacteristic) {
        method = 'ble';
        const buffer = new TextEncoder().encode(command);
        await this.commandCharacteristic.writeValue(buffer);
        console.log(`📱 Sent command via BLE: ${command}`);
        success = true;
      } else {
        throw new Error('No connection available');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    }
  }

  async delayRequest(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async getIPAddress(): Promise<string | null> {
    if (!this.ipAddressCharacteristic) {
      console.log('📱 IP address characteristic not available (older device)');
      return null;
    }

    try {
      // Add delay to avoid GATT operation conflicts
      await this.delayRequest(500);
      const data = await this.ipAddressCharacteristic.readValue();
      const ipAddress = new TextDecoder().decode(data);
      console.log(`📱 Read IP address: ${ipAddress}`);
      return ipAddress;
    } catch (error) {
      console.log('📱 Failed to read IP address (older device):', error);
      return null;
    }
  }

  async setWiFiCredentials(ssid: string, password: string): Promise<void> {
    if (!this.wifiSSIDCharacteristic || !this.wifiPasswordCharacteristic) {
      throw new Error('WiFi characteristics not available (older device)');
    }

    const ssidBuffer = new TextEncoder().encode(ssid);
    const passwordBuffer = new TextEncoder().encode(password);
    
    await this.wifiSSIDCharacteristic.writeValue(ssidBuffer);
    await this.wifiPasswordCharacteristic.writeValue(passwordBuffer);
    
    console.log(`📱 Set WiFi credentials: SSID=${ssid}, Password=${password.length} chars`);
  }

  async getWiFiStatus(): Promise<string | null> {
    if (!this.wifiStatusCharacteristic) {
      console.log('📱 WiFi status characteristic not available (older device)');
      return null;
    }

    try {
      const data = await this.wifiStatusCharacteristic.readValue();
      const status = new TextDecoder().decode(data);
      console.log(`📱 Read WiFi status: ${status}`);
      return status;
    } catch (error) {
      console.log('📱 Failed to read WiFi status (older device):', error);
      return null;
    }
  }

  // WebSocket methods
  async connectWebSocket(ip: string): Promise<void> {
    console.log(`📱 WebSocket: Attempting to connect to ${ip}:8080`);
    
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      console.log('📱 WebSocket already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://${ip}:8080`;
        console.log(`📱 WebSocket: Creating connection to ${wsUrl}`);
        
        this.wsConnection = new WebSocket(wsUrl);
        this.wsIP = ip;

        this.wsConnection.onopen = () => {
          console.log(`📱 WebSocket: ✅ Connected to ${ip}:8080`);
          this.onCommunicationLog?.({
            id: `log-${Date.now()}-${Math.random()}`,
            deviceId: this.getDeviceId(),
            timestamp: new Date(),
            direction: 'out',
            method: 'websocket',
            command: `connectWebSocket(${ip})`,
            success: true,
            extraTags: [':8080']
          });
          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          console.log('📱 WebSocket: 📨 Message received:', event.data);
          this.onCommunicationLog?.({
            id: `log-${Date.now()}-${Math.random()}`,
            deviceId: this.getDeviceId(),
            timestamp: new Date(),
            direction: 'in',
            method: 'websocket',
            command: event.data,
            success: true,
            extraTags: [':8080']
          });
          resolve();
        };

        this.wsConnection.onerror = (error) => {
          console.error('📱 WebSocket: ❌ Error occurred:', error);
          console.error('📱 WebSocket: Error details:', {
            type: error.type,
            target: error.target,
            readyState: this.wsConnection?.readyState
          });
          reject(error);
        };

        this.wsConnection.onclose = (event) => {
          console.log(`📱 WebSocket: 🔌 Disconnected (code: ${event.code}, reason: ${event.reason})`);
          this.wsConnection = null;
          this.wsIP = null;
        };
      } catch (error) {
        console.error('📱 WebSocket: ❌ Exception during connection:', error);
        reject(error);
      }
    });
  }

  async sendWebSocketCommand(command: any): Promise<void> {
    const startTime = performance.now();
    console.log(`📱 WebSocket: Attempting to send command:`, command);
    
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      console.error(`📱 WebSocket: ❌ Not connected (readyState: ${this.wsConnection?.readyState})`);
      throw new Error('WebSocket not connected');
    }

    const message = JSON.stringify(command);
    console.log(`📱 WebSocket: 📤 Sending message: ${message}`);
    this.onCommunicationLog?.({
      id: `log-${Date.now()}-${Math.random()}`,
      deviceId: this.getDeviceId(),
      timestamp: new Date(),
      direction: 'out',
      method: 'websocket',
      command: message,
      success: true,
      extraTags: [':8080']
    });
    try {
      this.wsConnection.send(message);
      const endTime = performance.now();
      console.log(`📱 WebSocket: ✅ Command sent successfully in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error('📱 WebSocket: ❌ Error sending message:', error);
      throw error;
    }
  }

  isWebSocketConnected(): boolean {
    return this.wsConnection !== null && this.wsConnection.readyState === WebSocket.OPEN;
  }

  getWebSocketIP(): string | null {
    return this.wsIP;
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
      this.wsIP = null;
      console.log('📱 WebSocket disconnected');
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.wsConnection) {
      this.disconnectWebSocket();
    }
    if (this.bleConnection) {
      await this.bleConnection.disconnect();
    }
  }
  
  isConnected(): boolean {
    return this.isWebSocketConnected() || (this.bleConnection?.isConnected() || false);
  }
}
