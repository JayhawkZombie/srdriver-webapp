import { create } from 'zustand';

interface AppStore {
  // Simple state
  isConnecting: boolean;
  error: string | null;
  
  // Simple actions
  setConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  isConnecting: false,
  error: null,
  
  // Actions
  setConnecting: (isConnecting) => {
    set({ isConnecting });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));
