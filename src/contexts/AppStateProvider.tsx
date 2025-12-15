import React, { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

interface AppStateProviderProps {
  children: React.ReactNode;
}

/**
 * AppStateProvider ensures the Zustand store is initialized and hydrated
 * from localStorage before components try to use it.
 * 
 * This is a lightweight provider that doesn't block rendering - persist
 * hydration happens asynchronously in the background.
 */
export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  // Access the store on mount to ensure it's initialized
  // The persist middleware will hydrate from localStorage automatically
  useEffect(() => {
    // Just accessing the store ensures initialization
    // No blocking operations - hydration happens in background
    useAppStore.getState();
  }, []);

  return <>{children}</>;
};

/**
 * Convenience hook to access app state
 * Components can also use useAppStore directly if preferred
 */
export const useAppState = () => {
  return useAppStore();
};



