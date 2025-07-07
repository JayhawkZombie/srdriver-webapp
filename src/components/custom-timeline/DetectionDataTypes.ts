// Types for DetectionDataContext and related consumers
export interface BandConfig {
  name: string;
  pcm: Float32Array;
  color: string;
}
export interface DetectionResult {
  detectionFunction: number[];
  times: number[];
  events: { time: number; strength?: number }[];
  error?: string;
}
export interface DetectionDataContextValue {
  results: DetectionResult | null;
  setResults: React.Dispatch<React.SetStateAction<DetectionResult | null>>;
  bandResults: DetectionResult[];
  setBandResults: React.Dispatch<React.SetStateAction<DetectionResult[]>>;
  progress: { processed: number; total: number } | null;
  setProgress: React.Dispatch<React.SetStateAction<{ processed: number; total: number } | null>>;
  bandProgress: Array<{ processed: number; total: number } | null>;
  setBandProgress: React.Dispatch<React.SetStateAction<Array<{ processed: number; total: number } | null>>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error?: string;
  setError: React.Dispatch<React.SetStateAction<string | undefined>>;
  runDetection?: () => void;
} 