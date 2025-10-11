import { BLEConnection } from './BLEConnection';

export class SRDriver {
  private bleConnection: BLEConnection;
  private brightnessCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private ipAddressCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

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
}
