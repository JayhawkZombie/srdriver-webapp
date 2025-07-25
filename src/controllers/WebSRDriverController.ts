import type { ISRDriverController, RGBColor } from '../types/srdriver';
import {
  CONTROL_SERVICE_UUID,
  BRIGHTNESS_CHARACTERISTIC_UUID,
  SPEED_CHARACTERISTIC_UUID,
  PATTERN_INDEX_CHARACTERISTIC_UUID,
  HIGH_COLOR_CHARACTERISTIC_UUID,
  LOW_COLOR_CHARACTERISTIC_UUID,
  LEFT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID,
  RIGHT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID,
  COMMAND_CHARACTERISTIC_UUID
} from '../types/srdriver';
import { useAppStore } from '../store/appStore';
import { useBenchmarkStore } from '../store/benchmarkStore';

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
  private _debounceBrightnessTimeout: ReturnType<typeof setTimeout> | null = null;
  private _lastBrightnessValue: number | null = null;
  private _debouncers: Record<string, { timeout: ReturnType<typeof setTimeout> | null; lastValue: unknown }> = {};
  private _onPong?: (rtt: number) => void;
  private _pendingPingTimestamp?: number;

  constructor() {}

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
          filters: [{ name: "SRDriver" }],
          // optionalServices: [CONTROL_SERVICE_UUID]
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
      let device: BluetoothDevice | null = null;
      // Strategy 1: Try with exact name filter
      try {
        console.log('Trying to find device with exact control service:', CONTROL_SERVICE_UUID);
        device = await navigator.bluetooth.requestDevice({
          filters: [{ services: [CONTROL_SERVICE_UUID] }],
        });
        console.log('Found device with exact control service:', device.name);
      } catch {
        console.log('Exact control service filter failed, trying namePrefix...');
        // Strategy 2: Try with namePrefix
        try {
          device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'SR' }],
            optionalServices: [CONTROL_SERVICE_UUID]
          });
          console.log('Found device with name prefix:', device.name);
        } catch {
          console.log('Name prefix filter failed, trying all devices...');
          // Strategy 3: Try with service filter
          try {
            device = await navigator.bluetooth.requestDevice({
              acceptAllDevices: true,
            });
            console.log('Found device with service filter:', device.name);
          } catch {
            console.log('All discovery strategies failed');
            throw new Error('No compatible SRDriver device found. Please ensure the device is powered on and in range.');
          }
        }
      }
      if (!device) {
        throw new Error("No device selected");
      }
      this.device = device;
      console.log("Connecting to device", this.device);
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

      // --- Setup notifications for all characteristics ---
      // Helper to parse and call the right callback
      const parseAndNotify = (charName: string, value: DataView) => {
        console.log(`[BLE] ${charName} value: ${JSON.stringify(value)}`);
        const decoder = new TextDecoder();
        const str = decoder.decode(value);
        switch (charName) {
          case 'brightness':
            if (this.onBrightnessChange) this.onBrightnessChange(parseInt(str, 10));
            break;
          case 'speed':
            if (this.onSpeedChange) this.onSpeedChange(parseInt(str, 10));
            break;
          case 'pattern':
            if (this.onPatternChange) this.onPatternChange(parseInt(str, 10));
            break;
          case 'highColor': {
            const [r, g, b] = str.split(',').map(s => parseInt(s, 10));
            if (this.onHighColorChange) this.onHighColorChange({ r, g, b });
            break;
          }
          case 'lowColor': {
            const [r, g, b] = str.split(',').map(s => parseInt(s, 10));
            if (this.onLowColorChange) this.onLowColorChange({ r, g, b });
            break;
          }
          case 'leftSeriesCoefficients': {
            const coeffs = str.split(',').map(s => parseFloat(s));
            if (this.onLeftSeriesCoefficientsChange) this.onLeftSeriesCoefficientsChange(coeffs as [number, number, number]);
            break;
          }
          case 'rightSeriesCoefficients': {
            const coeffs = str.split(',').map(s => parseFloat(s));
            if (this.onRightSeriesCoefficientsChange) this.onRightSeriesCoefficientsChange(coeffs as [number, number, number]);
            break;
          }
          case 'command': {
            console.log(`[BLE] command: ${str}`);
            if (str.startsWith("pong:")) {
              const pongTimestamp = parseInt(str.split(":")[1], 10);
              if (this._pendingPingTimestamp && pongTimestamp === this._pendingPingTimestamp) {
                const rtt = Date.now() - pongTimestamp;
                if (!this.deviceId) {
                  console.error('Attempted to update RTT for undefined deviceId');
                  return;
                }
                console.log(`[BLE RTT] Pong received for device ${this.deviceId}: RTT = ${rtt} ms (pongTimestamp: ${pongTimestamp}, now: ${Date.now()})`);
                // Update Zustand store with RTT for this device
                useAppStore.getState().setDeviceConnection(this.deviceId, { bleRTT: rtt });
                console.log(`[BLE RTT] Updated Zustand for device ${this.deviceId} with RTT: ${rtt} ms`);
                this._onPong?.(rtt);
                this._pendingPingTimestamp = undefined;
              } else {
                console.log(`[BLE RTT] Pong received but no matching pending ping for device ${this.deviceId}`);
              }
            }
            break;
          }
        }
      };

      // Setup notification for a characteristic
      const setupNotification = async (char: BluetoothRemoteGATTCharacteristic | null, name: string) => {
        if (!char) return;
        try {
          await char.startNotifications();
          char.addEventListener('characteristicvaluechanged', (event: Event) => {
            const target = event.target as BluetoothRemoteGATTCharacteristic;
            if (target && target.value) {
              parseAndNotify(name, target.value);
            }
          });
        } catch (e) {
          console.warn(`Failed to start notifications for ${name}:`, e);
        }
      };

      await setupNotification(this.brightnessCharacteristic, 'brightness');
      await setupNotification(this.speedCharacteristic, 'speed');
      await setupNotification(this.patternCharacteristic, 'pattern');
      await setupNotification(this.highColorCharacteristic, 'highColor');
      await setupNotification(this.lowColorCharacteristic, 'lowColor');
      await setupNotification(this.leftSeriesCoefficientsCharacteristic, 'leftSeriesCoefficients');
      await setupNotification(this.rightSeriesCoefficientsCharacteristic, 'rightSeriesCoefficients');
      await setupNotification(this.commandCharacteristic, 'command');
      // Command characteristic does not need notification

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

  // Shared helper for writing a number to a characteristic
  private async writeNumberCharacteristic(
    characteristic: BluetoothRemoteGATTCharacteristic | null,
    value: number,
    label: string
  ): Promise<void> {
    if (!characteristic) {
      throw new Error(`No ${label} characteristic`);
    }
    const encoder = new TextEncoder();
    const valueString = Math.round(value).toString();
    await characteristic.writeValue(encoder.encode(valueString));
    console.log(`Set ${label} to: ${valueString}`);
  }

  // Private immediate BLE write methods
  private async _setBrightnessImmediate(value: number): Promise<void> {
    await this.writeNumberCharacteristic(this.brightnessCharacteristic, value, 'brightness');
  }
  private async _setSpeedImmediate(value: number): Promise<void> {
    await this.writeNumberCharacteristic(this.speedCharacteristic, value, 'speed');
  }
  private async _setPatternImmediate(index: number): Promise<void> {
    await this.writeNumberCharacteristic(this.patternCharacteristic, index, 'pattern');
  }
  private async _setHighColorImmediate(color: RGBColor): Promise<void> {
    if (!this.highColorCharacteristic) {
      throw new Error('No high color characteristic');
    }
    const encoder = new TextEncoder();
    const colorString = `${color.r},${color.g},${color.b}`;
    await this.highColorCharacteristic.writeValue(encoder.encode(colorString));
    console.log(`Set high color to: ${colorString}`);
  }
  private async _setLowColorImmediate(color: RGBColor): Promise<void> {
    if (!this.lowColorCharacteristic) {
      throw new Error('No low color characteristic');
    }
    const encoder = new TextEncoder();
    const colorString = `${color.r},${color.g},${color.b}`;
    await this.lowColorCharacteristic.writeValue(encoder.encode(colorString));
    console.log(`Set low color to: ${colorString}`);
  }
  private async _setLeftSeriesCoefficientsImmediate(coeffs: [number, number, number]): Promise<void> {
    if (!this.leftSeriesCoefficientsCharacteristic) {
      throw new Error('No left series coefficients characteristic');
    }
    const encoder = new TextEncoder();
    const coeffsString = `${coeffs[0].toFixed(2)},${coeffs[1].toFixed(2)},${coeffs[2].toFixed(2)}`;
    await this.leftSeriesCoefficientsCharacteristic.writeValue(encoder.encode(coeffsString));
    console.log(`Set left series coefficients to: ${coeffsString}`);
  }
  private async _setRightSeriesCoefficientsImmediate(coeffs: [number, number, number]): Promise<void> {
    if (!this.rightSeriesCoefficientsCharacteristic) {
      throw new Error('No right series coefficients characteristic');
    }
    const encoder = new TextEncoder();
    const coeffsString = `${coeffs[0].toFixed(2)},${coeffs[1].toFixed(2)},${coeffs[2].toFixed(2)}`;
    await this.rightSeriesCoefficientsCharacteristic.writeValue(encoder.encode(coeffsString));
    console.log(`Set right series coefficients to: ${coeffsString}`);
  }

  // Public debounced methods
  setBrightness(value: number, delay: number = 100): void {
    this.debouncedWrite('brightness', value, async (v) => {
      await this._setBrightnessImmediate(v);
      if (!this.deviceId) {
        console.error('Attempted to update brightness for undefined deviceId');
        return;
      }
      useAppStore.getState().setDeviceState(this.deviceId, { brightness: v });
    }, delay);
  }
  setSpeed(value: number, delay: number = 100): void {
    this.debouncedWrite('speed', value, async (v) => {
      await this._setSpeedImmediate(v);
      if (!this.deviceId) {
        console.error('Attempted to update speed for undefined deviceId');
        return;
      }
      useAppStore.getState().setDeviceState(this.deviceId, { speed: v });
    }, delay);
  }
  setPattern(index: number, delay: number = 100): void {
    this.debouncedWrite('pattern', index, async (v) => {
      await this._setPatternImmediate(v);
      if (!this.deviceId) {
        console.error('Attempted to update pattern for undefined deviceId');
        return;
      }
      useAppStore.getState().setDeviceState(this.deviceId, { patternIndex: v });
    }, delay);
  }

  // Public debounced setter methods
  setHighColor(color: RGBColor, delay: number = 100): void {
    this.debouncedWrite('highColor', color, async (v) => {
      await this._setHighColorImmediate(v);
      // Optionally: update Device object in context for optimistic UI
      // (skip Zustand deviceState update for highColor)
    }, delay);
  }
  setLowColor(color: RGBColor, delay: number = 100): void {
    this.debouncedWrite('lowColor', color, async (v) => {
      await this._setLowColorImmediate(v);
      // Optionally: update Device object in context for optimistic UI
      // (skip Zustand deviceState update for lowColor)
    }, delay);
  }
  setLeftSeriesCoefficients(coeffs: [number, number, number], delay: number = 100): void {
    this.debouncedWrite('leftSeriesCoefficients', coeffs, (v) => this._setLeftSeriesCoefficientsImmediate(v), delay);
  }
  setRightSeriesCoefficients(coeffs: [number, number, number], delay: number = 100): void {
    this.debouncedWrite('rightSeriesCoefficients', coeffs, (v) => this._setRightSeriesCoefficientsImmediate(v), delay);
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
    this.commandCharacteristic.writeValue(encoder.encode(command));
    console.log(`Sent command: ${command}`);
  }

  async pulseBrightness(targetBrightness: number, durationMs: number): Promise<void> {
    const command = `pulse_brightness:${targetBrightness},${durationMs}`;
    this.sendCommand(command);
    // await this.sendCommand(command);
  }

  async fadeBrightness(targetBrightness: number, durationMs: number): Promise<void> {
    const command = `fade_brightness:${targetBrightness},${durationMs}`;
    this.sendCommand(command);
    // await this.sendCommand(command);
  }

  async firePattern(patternIndex: number, patternArgument: string): Promise<void> {
    const command = `fire_pattern:${patternIndex}-${patternArgument}`;
    this.sendCommand(command);
    // await this.sendCommand(command);
  }

  get deviceId(): string | undefined {
    return this.device?.id;
  }

  getDeviceId(): string | undefined {
    return this.device?.id;
  }

  public getService(): BluetoothRemoteGATTService | null {
    return this.service;
  }

  private debouncedWrite<T>(
    key: string,
    value: T,
    writeFn: (v: T) => Promise<void>,
    delay: number = 100
  ) {
    if (!this._debouncers[key]) {
      this._debouncers[key] = { timeout: null, lastValue: value };
    }
    this._debouncers[key].lastValue = value;
    if (this._debouncers[key].timeout) {
      clearTimeout(this._debouncers[key].timeout!);
    }
    this._debouncers[key].timeout = setTimeout(() => {
      writeFn(this._debouncers[key].lastValue as T);
    }, delay);
  }

  public setOnPongCallback(cb: (rtt: number) => void) {
    this._onPong = cb;
  }

  public async pingForRTT() {
    const timestamp = Date.now();
    this._pendingPingTimestamp = timestamp;
    await this.sendCommand(`ping:${timestamp}`);
  }

  public getDeviceName(): string {
    return this.device?.name || '';
  }
} 