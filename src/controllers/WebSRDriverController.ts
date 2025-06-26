import { 
  ISRDriverController, 
  RGBColor, 
  BLE_SERVICE_UUID, 
  CONTROL_SERVICE_UUID,
  BRIGHTNESS_CHARACTERISTIC_UUID,
  SPEED_CHARACTERISTIC_UUID,
  PATTERN_INDEX_CHARACTERISTIC_UUID,
  HIGH_COLOR_CHARACTERISTIC_UUID,
  LOW_COLOR_CHARACTERISTIC_UUID,
  LEFT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID,
  RIGHT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID,
  COMMAND_CHARACTERISTIC_UUID,
  AUTH_CHARACTERISTIC_UUID,
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
  private authCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private authenticated: boolean = false;

  // Callbacks
  onBrightnessChange?: (value: number) => void;
  onSpeedChange?: (value: number) => void;
  onPatternChange?: (index: number) => void;
  onHighColorChange?: (color: RGBColor) => void;
  onLowColorChange?: (color: RGBColor) => void;
  onLeftSeriesCoefficientsChange?: (coeffs: [number, number, number]) => void;
  onRightSeriesCoefficientsChange?: (coeffs: [number, number, number]) => void;
  onAuthenticationChange?: (authenticated: boolean) => void;

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
          optionalServices: [BLE_SERVICE_UUID]
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
          const hasOurService = services.some(s => s.uuid.toLowerCase() === BLE_SERVICE_UUID.toLowerCase());
          console.log('Our service available:', hasOurService);
          
          if (hasOurService) {
            const service = await server.getPrimaryService(BLE_SERVICE_UUID);
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
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not supported in this browser');
      }

      console.log('Starting BLE device discovery...');
      
      // Try multiple discovery strategies
      let device: BluetoothDevice | null = null;
      
      // Strategy 1: Try with exact name filter
      try {
        console.log('Trying to find device with exact name:', DEVICE_NAME);
        device = await navigator.bluetooth.requestDevice({
          filters: [{ name: DEVICE_NAME }],
          optionalServices: [BLE_SERVICE_UUID, CONTROL_SERVICE_UUID]
        });
        console.log('Found device with exact name:', device.name);
      } catch (error) {
        console.log('Exact name filter failed, trying service-based discovery...');
        
        // Strategy 2: Try with service-based discovery (more flexible)
        try {
          device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [BLE_SERVICE_UUID] }],
            optionalServices: [BLE_SERVICE_UUID, CONTROL_SERVICE_UUID]
          });
          console.log('Found device with service filter:', device.name);
        } catch (serviceError) {
          console.log('Service-based discovery failed, trying name prefix...');
          
          // Strategy 3: Try with name prefix (in case device name has variations)
          try {
            device = await navigator.bluetooth.requestDevice({
              filters: [{ namePrefix: 'SR' }],
              optionalServices: [BLE_SERVICE_UUID, CONTROL_SERVICE_UUID]
            });
            console.log('Found device with name prefix:', device.name);
          } catch (prefixError) {
            console.log('All discovery strategies failed');
            throw new Error('No compatible SRDriver device found. Please ensure the device is powered on and in range.');
          }
        }
      }

      if (!device) {
        throw new Error('No device selected');
      }

      this.device = device;
      console.log('Selected device:', device.name, 'ID:', device.id);

      // Connect to GATT server
      console.log('Connecting to GATT server...');
      const server = await this.device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }
      console.log('Connected to GATT server');

      // Get the service
      console.log('Getting primary service...');
      this.service = await server.getPrimaryService(BLE_SERVICE_UUID);
      if (!this.service) {
        throw new Error('Failed to get primary service');
      }
      console.log('Got primary service');

      // Get characteristics
      console.log('Getting characteristics...');
      this.authCharacteristic = await this.service.getCharacteristic(AUTH_CHARACTERISTIC_UUID);
      console.log('Got auth characteristic');

      // // Immediately check authentication status
      // try {
      //   const value = await this.authCharacteristic.readValue();
      //   const decoder = new TextDecoder();
      //   const response = decoder.decode(value);
      //   if (response === '1') {
      //     this.authenticated = true;
      //     this.onAuthenticationChange?.(true);
      //     console.log('Already authenticated on connect');
      //   }
      // } catch (e) {
      //   console.warn('Could not read initial auth status:', e);
      // }

      // Set up notifications if supported
      await this.setupAuthNotifications();

      console.log('Successfully connected to SRDriver');
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
    this.authCharacteristic = null;
    this.commandCharacteristic = null;
    console.log('Disconnected from SRDriver');
  }

  isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  async authenticate(pin: string): Promise<boolean> {
    if (!this.authCharacteristic) {
      throw new Error('No auth characteristic');
    }

    const attemptToAuthenticate = async () => {
      console.log('Attempting to authenticate...');
      const encoder = new TextEncoder();
      await this.authCharacteristic?.writeValue(encoder.encode(pin));
      
      // Read the response
      const value = await this.authCharacteristic?.readValue();
      const decoder = new TextDecoder();
      const response = decoder.decode(value);

      this.authenticated = response === '1';
      this.onAuthenticationChange?.(this.authenticated);
      console.log(`Authentication ${this.authenticated ? 'successful' : 'failed'}`);
      
      if (this.authenticated) {
        // Connect to control service after successful authentication
        await this.connectToControlService();
      }

      return this.authenticated;
    };
    
    try {
      const attempt = await attemptToAuthenticate();
      if (!attempt) {
        console.log('Authentication failed (not throwing), trying again...');
        // Trying to disconnect and reconnect to get the new characteristics, otherwise
        // we will think we failed to authenticate because the characteristics
        // are not available.
        await this.disconnect();
        await this.connect();
        const attempt2 = await attemptToAuthenticate();
        if (!attempt2) {
          console.error('Authentication failed (not throwing), not trying again...');
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Authentication threw an error:', error);
      // Trying to disconnect and reconnect to get the new characteristics, otherwise
      // we will think we failed to authenticate because the characteristics
      // are not available.
      console.log("Trying one more time");
      // await this.disconnect();
      // await this.connect();
      const attempt = await attemptToAuthenticate();
      if (!attempt) {
        console.error('Authentication failed (not throwing), not trying again...');
        return false;
      }
      return true;
    }
    return false;
  }

  private async connectToControlService(): Promise<void> {
    if (!this.device?.gatt?.connected) {
      throw new Error('Not connected to device');
    }
    
    try {
      console.log('Connecting to control service...');
      const controlService = await this.device.gatt.getPrimaryService(CONTROL_SERVICE_UUID);
      if (!controlService) {
        throw new Error('Failed to get control service');
      }
      console.log('Got control service');

      // Get control characteristics
      console.log('Getting control characteristics...');
      this.brightnessCharacteristic = await controlService.getCharacteristic(BRIGHTNESS_CHARACTERISTIC_UUID);
      this.speedCharacteristic = await controlService.getCharacteristic(SPEED_CHARACTERISTIC_UUID);
      this.patternCharacteristic = await controlService.getCharacteristic(PATTERN_INDEX_CHARACTERISTIC_UUID);
      this.highColorCharacteristic = await controlService.getCharacteristic(HIGH_COLOR_CHARACTERISTIC_UUID);
      this.lowColorCharacteristic = await controlService.getCharacteristic(LOW_COLOR_CHARACTERISTIC_UUID);
      this.leftSeriesCoefficientsCharacteristic = await controlService.getCharacteristic(LEFT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID);
      this.rightSeriesCoefficientsCharacteristic = await controlService.getCharacteristic(RIGHT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID);
      this.commandCharacteristic = await controlService.getCharacteristic(COMMAND_CHARACTERISTIC_UUID);
      console.log('Got all control characteristics');

      // Set up notifications for control characteristics
      await this.setupControlNotifications();
      
      console.log('Successfully connected to control service');
    } catch (error) {
      console.error('Failed to connect to control service:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated;
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

  private async setupAuthNotifications(): Promise<void> {
    try {
      // Set up notifications for each characteristic if they support it
      if (this.authCharacteristic?.properties.notify) {
        await this.authCharacteristic.startNotifications();
        this.authCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = event.target as BluetoothRemoteGATTCharacteristic;
          const decoder = new TextDecoder();
          const authenticated = decoder.decode(value.value!) === 'true';
          this.onAuthenticationChange?.(authenticated);
        });
      }
    } catch (error) {
      console.warn('Failed to set up notifications:', error);
    }
  }

  private async setupControlNotifications(): Promise<void> {
    try {
      // Set up notifications for each characteristic if they support it
      if (this.brightnessCharacteristic?.properties.notify) {
        await this.brightnessCharacteristic.startNotifications();
        this.brightnessCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = event.target as BluetoothRemoteGATTCharacteristic;
          const decoder = new TextDecoder();
          const valueString = decoder.decode(value.value!);
          const brightness = parseInt(valueString, 10);
          this.onBrightnessChange?.(brightness);
        });
      }

      if (this.speedCharacteristic?.properties.notify) {
        await this.speedCharacteristic.startNotifications();
        this.speedCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = event.target as BluetoothRemoteGATTCharacteristic;
          const decoder = new TextDecoder();
          const valueString = decoder.decode(value.value!);
          const speed = parseInt(valueString, 10);
          this.onSpeedChange?.(speed);
        });
      }

      if (this.patternCharacteristic?.properties.notify) {
        await this.patternCharacteristic.startNotifications();
        this.patternCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = event.target as BluetoothRemoteGATTCharacteristic;
          const decoder = new TextDecoder();
          const valueString = decoder.decode(value.value!);
          const pattern = parseInt(valueString, 10);
          this.onPatternChange?.(pattern);
        });
      }

      if (this.highColorCharacteristic?.properties.notify) {
        await this.highColorCharacteristic.startNotifications();
        this.highColorCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = event.target as BluetoothRemoteGATTCharacteristic;
          const decoder = new TextDecoder();
          const colorString = decoder.decode(value.value!);
          const [r, g, b] = colorString.split(',').map(s => parseInt(s, 10));
          this.onHighColorChange?.({ r, g, b });
        });
      }

      if (this.lowColorCharacteristic?.properties.notify) {
        await this.lowColorCharacteristic.startNotifications();
        this.lowColorCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = event.target as BluetoothRemoteGATTCharacteristic;
          const decoder = new TextDecoder();
          const colorString = decoder.decode(value.value!);
          const [r, g, b] = colorString.split(',').map(s => parseInt(s, 10));
          this.onLowColorChange?.({ r, g, b });
        });
      }

      if (this.leftSeriesCoefficientsCharacteristic?.properties.notify) {
        await this.leftSeriesCoefficientsCharacteristic.startNotifications();
        this.leftSeriesCoefficientsCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = event.target as BluetoothRemoteGATTCharacteristic;
          const decoder = new TextDecoder();
          const coeffsString = decoder.decode(value.value!);
          const coeffs = coeffsString.split(',').map(s => parseFloat(s)) as [number, number, number];
          this.onLeftSeriesCoefficientsChange?.(coeffs);
        });
      }

      if (this.rightSeriesCoefficientsCharacteristic?.properties.notify) {
        await this.rightSeriesCoefficientsCharacteristic.startNotifications();
        this.rightSeriesCoefficientsCharacteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = event.target as BluetoothRemoteGATTCharacteristic;
          const decoder = new TextDecoder();
          const coeffsString = decoder.decode(value.value!);
          const coeffs = coeffsString.split(',').map(s => parseFloat(s)) as [number, number, number];
          this.onRightSeriesCoefficientsChange?.(coeffs);
        });
      }
    } catch (error) {
      console.warn('Failed to set up notifications:', error);
    }
  }
} 