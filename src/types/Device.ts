import { WebSRDriverController } from '../controllers/WebSRDriverController';

export interface Device {
  id: string;
  name: string;
  controller: WebSRDriverController;
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  brightness: number;
  patternIndex: number;
  highColor: {r: number, g: number, b: number};
  lowColor: {r: number, g: number, b: number};
  savedHighColor: {r: number, g: number, b: number};
  savedLowColor: {r: number, g: number, b: number};
} 