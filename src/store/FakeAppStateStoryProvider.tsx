import React, { useEffect } from 'react';
import { useAppStore } from './appStore';

interface FakeAppStateStoryProviderProps {
  children: React.ReactNode;
  initialState?: Partial<ReturnType<typeof useAppStore.getState>>;
}

export const FakeAppStateStoryProvider: React.FC<FakeAppStateStoryProviderProps> = ({ children, initialState }) => {
  useEffect(() => {
    if (initialState) {
      // Set each key in initialState to the store
      for (const [key, value] of Object.entries(initialState)) {
          if (
              typeof useAppStore.getState()[
                  key as keyof ReturnType<typeof useAppStore.getState>
              ] === "function"
          )
              continue; // skip actions
          useAppStore.setState({ [key]: value });
      }
    }
  }, [initialState]);
  return <>{children}</>;
}; 