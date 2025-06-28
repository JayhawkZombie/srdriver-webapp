// BLE Service and Characteristic UUIDs from your SRDriver hardware
export const CONTROL_SERVICE_UUID = 'b1862b70-e0ce-4b1b-9734-d7629eb8d711'; // Control service (only after auth)
export const BRIGHTNESS_CHARACTERISTIC_UUID = '4df3a1f9-2a42-43ee-ac96-f7db09abb4f0';
export const SPEED_CHARACTERISTIC_UUID = "a5fb3bc5-9633-4b85-8a42-7756f11ef7ac";
export const PATTERN_INDEX_CHARACTERISTIC_UUID = 'e95785e0-220e-4cd9-8839-7e92595e47b0';
export const HIGH_COLOR_CHARACTERISTIC_UUID = '932334a3-8544-4edc-ba49-15055eb1c877';
export const LOW_COLOR_CHARACTERISTIC_UUID = '8cdb8d7f-d2aa-4621-a91f-ca3f54731950';
export const LEFT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID = '762ff1a5-8965-4d5c-b98e-4faf9b382267';
export const RIGHT_SERIES_COEFFICIENTS_CHARACTERISTIC_UUID = '386e0c80-fb59-4e8b-b5d7-6eca4d68ce33';
export const COMMAND_CHARACTERISTIC_UUID = 'c1862b70-e0ce-4b1b-9734-d7629eb8d712';

// Device name
export const DEVICE_NAME = 'SRDriver';

// Interface for RGB color values
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Interface for series coefficients (3 coefficients for left and right)
export interface SeriesCoefficients {
  left: [number, number, number];
  right: [number, number, number];
}

// Main controller interface
export interface ISRDriverController {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  setBrightness(value: number): Promise<void>;
  setPattern(index: number): Promise<void>;
  setHighColor(color: RGBColor): Promise<void>;
  setLowColor(color: RGBColor): Promise<void>;
  setLeftSeriesCoefficients(coeffs: [number, number, number]): Promise<void>;
  setRightSeriesCoefficients(coeffs: [number, number, number]): Promise<void>;
  getBrightness(): Promise<number>;
  getPattern(): Promise<number>;
  getHighColor(): Promise<RGBColor>;
  getLowColor(): Promise<RGBColor>;
  getLeftSeriesCoefficients(): Promise<[number, number, number]>;
  getRightSeriesCoefficients(): Promise<[number, number, number]>;
  sendCommand(command: string): Promise<void>;
  pulseBrightness(targetBrightness: number, durationMs: number): Promise<void>;
  firePattern(patternIndex: number): Promise<void>;
  onBrightnessChange?(value: number): void;
  onPatternChange?(index: number): void;
  onHighColorChange?(color: RGBColor): void;
  onLowColorChange?(color: RGBColor): void;
  onLeftSeriesCoefficientsChange?(coeffs: [number, number, number]): void;
  onRightSeriesCoefficientsChange?(coeffs: [number, number, number]): void;
}

// Connection state
export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
} 