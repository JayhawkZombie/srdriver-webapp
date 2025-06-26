import { 
  ISRDriverController, 
  RGBColor,
  CONTROL_SERVICE_UUID,
  BRIGHTNESS_CHARACTERISTIC_UUID,
  SPEED_CHARACTERISTIC_UUID,
  PATTERN_INDEX_CHARACTERISTIC_UUID,
  HIGH_COLOR_CHARACTERISTIC_UUID,
  LOW_COLOR_CHARACTERISTIC_UUID,
  LEFT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID,
  RIGHT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID,
  COMMAND_CHARACTERISTIC_UUID,
  DEVICE_NAME
} from '../types/srdriver';

export class WebSRDriverController implements ISRDriverController {
  private device: BluetoothDevice | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private brightnessCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private speedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private patternCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private highColorCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private lowColorCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private leftSeriesCoefficientsCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private rightSeriesCoefficientsCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Callbacks
  onBrightnessChange?: (value: number) => void;
  onSpeedChange?: (value: number) => void;
  onPatternChange?: (index: number) => void;
  onHighColorChange?: (color: RGBColor) => void;
  onLowColorChange?: (color: RGBColor) => void;
  onLeftSeriesCoefficientsChange?: (coeffs: [number, number, number]) => void;
  onRightSeriesCoefficientsChange?: (coeffs: [number, number, number]) => void;

  // Debug method to help troubleshoot device discovery
  async debugDeviceDiscovery(): Promise<void> {
    try {
      console.log('=== BLE Device Discovery Debug ===');
      console.log('Web Bluetooth supported:', !!navigator.bluetooth);
      
      if (!navigator.bluetooth) {
        console.error('Web Bluetooth API is not supported');
        return;
      }

      // Try to get any available device to see what's out there
      console.log('Attempting to discover any available BLE devices...');
      
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [CONTROL_SERVICE_UUID]
        });
        
        console.log('Found device:', {
          name: device.name,
          id: device.id,
          uuids: device.uuids
        });
        
        // Try to connect and get services
        console.log('Attempting to connect to device...');
        const server = await device.gatt?.connect();
        if (server) {
          console.log('Connected to GATT server');
          const services = await server.getPrimaryServices();
          console.log('Available services:', services.map(s => s.uuid));
          
          // Check if our service is available
          const hasOurService = services.some(s => s.uuid.toLowerCase() === CONTROL_SERVICE_UUID.toLowerCase());
          console.log('Our service available:', hasOurService);
          
          if (hasOurService) {
            const service = await server.getPrimaryService(CONTROL_SERVICE_UUID);
            const characteristics = await service.getCharacteristics();
            console.log('Available characteristics:', characteristics.map(c => c.uuid));
          }
          
          await server.disconnect();
        }
      } catch (error) {
        console.log('Debug discovery failed:', error);
      }
      
      console.log('=== End Debug ===');
    } catch (error) {
      console.error('Debug method failed:', error);
    }
  }

  async connect(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error("Web Bluetooth API is not supported in this browser");
      }
      console.log("Starting BLE device discovery...");
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [CONTROL_SERVICE_UUID]
      });
      if (!device) {
        throw new Error("No device selected");
      }
      this.device = device;
      const server = await this.device.gatt?.connect();
      if (!server) {
        throw new Error("Failed to connect to GATT server");
      }
      // Get all available services
      const services = await server.getPrimaryServices();
      console.log('Available services:', services.map(s => s.uuid));
      // Check if our control service is available
      const hasControlService = services.some(s => s.uuid.toLowerCase() === CONTROL_SERVICE_UUID.toLowerCase());
      if (!hasControlService) {
        throw new Error("SRDriver control service not found on device");
      }
      this.service = await server.getPrimaryService(CONTROL_SERVICE_UUID);
      if (!this.service) {
        throw new Error("Failed to get control service");
      }
      // Get all control characteristics
      this.brightnessCharacteristic = await this.service.getCharacteristic(BRIGHTNESS_CHARACTERISTIC_UUID);
      this.speedCharacteristic = await this.service.getCharacteristic(SPEED_CHARACTERISTIC_UUID);
      this.patternCharacteristic = await this.service.getCharacteristic(PATTERN_INDEX_CHARACTERISTIC_UUID);
      this.highColorCharacteristic = await this.service.getCharacteristic(HIGH_COLOR_CHARACTERISTIC_UUID);
      this.lowColorCharacteristic = await this.service.getCharacteristic(LOW_COLOR_CHARACTERISTIC_UUID);
      this.leftSeriesCoefficientsCharacteristic = await this.service.getCharacteristic(LEFT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID);
      this.rightSeriesCoefficientsCharacteristic = await this.service.getCharacteristic(RIGHT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID);
      this.commandCharacteristic = await this.service.getCharacteristic(COMMAND_CHARACTERISTIC_UUID);
      return true;
    } catch (error) {
      console.error('Failed to connect to SRDriver:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      await this.device.gatt.disconnect();
    }
    this.device = null;
    this.service = null;
    this.speedCharacteristic = null;
    this.brightnessCharacteristic = null;
    this.patternCharacteristic = null;
    this.highColorCharacteristic = null;
    this.lowColorCharacteristic = null;
    this.leftSeriesCoefficientsCharacteristic = null;
    this.rightSeriesCoefficientsCharacteristic = null;
    this.commandCharacteristic = null;
    console.log('Disconnected from SRDriver');
  }

  isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  async setSpeed(value: number): Promise<void> {
    if (!this.speedCharacteristic) {
      throw new Error('No speed characteristic');
    }
    
    const encoder = new TextEncoder();
    const valueString = Math.round(value).toString();
    await this.speedCharacteristic.writeValue(encoder.encode(valueString));
    console.log(`Set speed to: ${valueString}`);
  }

  async setBrightness(value: number): Promise<void> {
    if (!this.brightnessCharacteristic) {
      throw new Error('No brightness characteristic');
    }
    
    const encoder = new TextEncoder();
    const valueString = Math.round(value).toString();
    await this.brightnessCharacteristic.writeValue(encoder.encode(valueString));
    console.log(`Set brightness to: ${valueString}`);
  }

  async setPattern(index: number): Promise<void> {
    if (!this.patternCharacteristic) {
      throw new Error('No pattern characteristic');
    }
    
    const encoder = new TextEncoder();
    const indexString = Math.round(index).toString();
    await this.patternCharacteristic.writeValue(encoder.encode(indexString));
    console.log(`Set pattern to: ${indexString}`);
  }

  async setHighColor(color: RGBColor): Promise<void> {
    if (!this.highColorCharacteristic) {
      throw new Error('No high color characteristic');
    }
    
    const encoder = new TextEncoder();
    const colorString = `${color.r},${color.g},${color.b}`;
    await this.highColorCharacteristic.writeValue(encoder.encode(colorString));
    console.log(`Set high color to: ${colorString}`);
  }

  async setLowColor(color: RGBColor): Promise<void> {
    if (!this.lowColorCharacteristic) {
      throw new Error('No low color characteristic');
    }
    
    const encoder = new TextEncoder();
    const colorString = `${color.r},${color.g},${color.b}`;
    await this.lowColorCharacteristic.writeValue(encoder.encode(colorString));
    console.log(`Set low color to: ${colorString}`);
  }

  async getBrightness(): Promise<number> {
    if (!this.brightnessCharacteristic) {
      throw new Error('No brightness characteristic');
    }
    
    const value = await this.brightnessCharacteristic.readValue();
    const decoder = new TextDecoder();
    const valueString = decoder.decode(value);
    return parseInt(valueString, 10);
  }

  async getSpeed(): Promise<number> {
    if (!this.speedCharacteristic) {
      throw new Error('No speed characteristic');
    }
    
    const value = await this.speedCharacteristic.readValue();
    const decoder = new TextDecoder();
    const valueString = decoder.decode(value);
    return parseInt(valueString, 10);
  }

  async getPattern(): Promise<number> {
    if (!this.patternCharacteristic) {
      throw new Error('No pattern characteristic');
    }
    
    const value = await this.patternCharacteristic.readValue();
    const decoder = new TextDecoder();
    const valueString = decoder.decode(value);
    return parseInt(valueString, 10);
  }

  async getHighColor(): Promise<RGBColor> {
    if (!this.highColorCharacteristic) {
      throw new Error('No high color characteristic');
    }
    
    const value = await this.highColorCharacteristic.readValue();
    const decoder = new TextDecoder();
    const colorString = decoder.decode(value);
    const [r, g, b] = colorString.split(',').map(s => parseInt(s, 10));
    return { r, g, b };
  }

  async getLowColor(): Promise<RGBColor> {
    if (!this.lowColorCharacteristic) {
      throw new Error('No low color characteristic');
    }
    
    const value = await this.lowColorCharacteristic.readValue();
    const decoder = new TextDecoder();
    const colorString = decoder.decode(value);
    const [r, g, b] = colorString.split(',').map(s => parseInt(s, 10));
    return { r, g, b };
  }

  async setLeftSeriesCoefficients(coeffs: [number, number, number]): Promise<void> {
    if (!this.leftSeriesCoefficientsCharacteristic) {
      throw new Error('No left series coefficients characteristic');
    }
    
    const encoder = new TextEncoder();
    const coeffsString = `${coeffs[0].toFixed(2)},${coeffs[1].toFixed(2)},${coeffs[2].toFixed(2)}`;
    await this.leftSeriesCoefficientsCharacteristic.writeValue(encoder.encode(coeffsString));
    console.log(`Set left series coefficients to: ${coeffsString}`);
  }

  async setRightSeriesCoefficients(coeffs: [number, number, number]): Promise<void> {
    if (!this.rightSeriesCoefficientsCharacteristic) {
      throw new Error('No right series coefficients characteristic');
    }
    
    const encoder = new TextEncoder();
    const coeffsString = `${coeffs[0].toFixed(2)},${coeffs[1].toFixed(2)},${coeffs[2].toFixed(2)}`;
    await this.rightSeriesCoefficientsCharacteristic.writeValue(encoder.encode(coeffsString));
    console.log(`Set right series coefficients to: ${coeffsString}`);
  }

  async getLeftSeriesCoefficients(): Promise<[number, number, number]> {
    if (!this.leftSeriesCoefficientsCharacteristic) {
      throw new Error('No left series coefficients characteristic');
    }
    
    const value = await this.leftSeriesCoefficientsCharacteristic.readValue();
    const decoder = new TextDecoder();
    const coeffsString = decoder.decode(value);
    const coeffs = coeffsString.split(',').map(s => parseFloat(s)) as [number, number, number];
    return coeffs;
  }

  async getRightSeriesCoefficients(): Promise<[number, number, number]> {
    if (!this.rightSeriesCoefficientsCharacteristic) {
      throw new Error('No right series coefficients characteristic');
    }
    
    const value = await this.rightSeriesCoefficientsCharacteristic.readValue();
    const decoder = new TextDecoder();
    const coeffsString = decoder.decode(value);
    const coeffs = coeffsString.split(',').map(s => parseFloat(s)) as [number, number, number];
    return coeffs;
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.commandCharacteristic) {
      throw new Error('No command characteristic');
    }
    
    const encoder = new TextEncoder();
    await this.commandCharacteristic.writeValue(encoder.encode(command));
    console.log(`Sent command: ${command}`);
  }

  async pulseBrightness(targetBrightness: number, durationMs: number): Promise<void> {
    const command = `pulse_brightness:${targetBrightness},${durationMs}`;
    await this.sendCommand(command);
  }
} 