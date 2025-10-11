import { BLEConnection } from './BLEConnection';

export class SRDriver {
  private bleConnection: BLEConnection;
  private brightnessCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private ipAddressCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private wifiSSIDCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private wifiPasswordCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private wifiStatusCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  constructor(bleConnection: BLEConnection) {
    this.bleConnection = bleConnection;
  }

  async initialize(): Promise<void> {
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

  async setBrightness(brightness: number): Promise<void> {
    if (!this.brightnessCharacteristic) {
      throw new Error('Brightness characteristic not available');
    }

    const value = brightness.toString();
    const buffer = new TextEncoder().encode(value);
    await this.brightnessCharacteristic.writeValue(buffer);
    console.log(`📱 Set brightness to: ${brightness}`);
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

  async sendCommand(command: string): Promise<void> {
    if (!this.commandCharacteristic) {
      throw new Error('Command characteristic not available');
    }

    const buffer = new TextEncoder().encode(command);
    await this.commandCharacteristic.writeValue(buffer);
    console.log(`📱 Sent command: ${command}`);
  }

  async getIPAddress(): Promise<string | null> {
    if (!this.ipAddressCharacteristic) {
      console.log('📱 IP address characteristic not available (older device)');
      return null;
    }

    try {
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
}
