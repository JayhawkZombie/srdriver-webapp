import { WebSRDriverController } from '../controllers/WebSRDriverController';

export interface Device {
  id: string;
  name: string;
  controller: WebSRDriverController;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  brightness: number;
  speed: number;
  patternIndex: number;
  highColor: {r: number, g: number, b: number};
  lowColor: {r: number, g: number, b: number};
  savedHighColor: {r: number, g: number, b: number};
  savedLowColor: {r: number, g: number, b: number};
  leftSeriesCoefficients: [number, number, number];
  rightSeriesCoefficients: [number, number, number];
  savedLeftSeriesCoefficients: [number, number, number];
  savedRightSeriesCoefficients: [number, number, number];
  macOrId: string;
  heartbeat?: {
    last: number | null;
    isAlive: boolean;
    pulse: boolean;
  };
} 