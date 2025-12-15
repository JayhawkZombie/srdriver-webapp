import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistedDeviceInfo } from '../types/App';

interface AppStore {
  // Non-persisted state (ephemeral UI state)
  isConnecting: boolean;
  error: string | null;
  
  // Persisted state
  deviceHistory: Record<string, PersistedDeviceInfo>;
  
  // Simple actions
  setConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Device history actions
  addDeviceToHistory: (deviceInfo: PersistedDeviceInfo) => void;
  removeDeviceFromHistory: (id: string) => void;
  clearDeviceHistory: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      isConnecting: false,
      error: null,
      deviceHistory: {},
      
      // Simple actions
      setConnecting: (isConnecting) => {
        set({ isConnecting });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      // Device history actions
      addDeviceToHistory: (deviceInfo) => {
        set((state) => ({
          deviceHistory: {
            ...state.deviceHistory,
            [deviceInfo.id]: deviceInfo,
          },
        }));
      },
      
      removeDeviceFromHistory: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.deviceHistory;
          return { deviceHistory: rest };
        });
      },
      
      clearDeviceHistory: () => {
        set({ deviceHistory: {} });
      },
    }),
    {
      name: 'srdriver-app-state',
      partialize: (state) => ({
        // Only persist deviceHistory, not ephemeral UI state
        deviceHistory: state.deviceHistory,
      }),
    }
  )
);

// Selector hooks for efficient component subscriptions
export const useDeviceHistory = (id: string) => {
  return useAppStore((state) => state.deviceHistory[id]);
};

export const useAllDeviceHistory = () => {
  return useAppStore((state) => state.deviceHistory);
};

export const useDeviceHistoryActions = () => {
  return useAppStore((state) => ({
    addDeviceToHistory: state.addDeviceToHistory,
    removeDeviceFromHistory: state.removeDeviceFromHistory,
    clearDeviceHistory: state.clearDeviceHistory,
  }));
};
