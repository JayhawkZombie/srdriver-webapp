import React, { useEffect, useRef } from 'react';
import { useAppStore } from './appStore';
import { getFakeAppState } from './mockAppState';

interface FakeAppStateStoryProviderProps {
  children: React.ReactNode;
  initialState?: Partial<ReturnType<typeof useAppStore.getState>>;
  mockType?: "sine" | "noise" | "randomBar" | "sineBar" | "beatBar" | "screenshotBar";
}

/**
 * FakeAppStateStoryProvider
 * - If initialState is provided, uses it to populate Zustand.
 * - If mockType is provided, uses getFakeAppState(mockType) to populate Zustand.
 * - If both are provided, initialState takes precedence.
 */
export const FakeAppStateStoryProvider: React.FC<FakeAppStateStoryProviderProps> = ({ children, initialState, mockType }) => {
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    let stateToSet = initialState;
    if (!initialState && mockType) {
      stateToSet = getFakeAppState(mockType);
    }
    if (stateToSet) {
      for (const [key, value] of Object.entries(stateToSet)) {
        if (typeof useAppStore.getState()[key as keyof ReturnType<typeof useAppStore.getState>] === 'function') continue;
        useAppStore.setState({ [key]: value });
      }
    }
    // Inject demo timeline responses if not already present
    const current = useAppStore.getState();
    if (!current.timeline?.responses || current.timeline.responses.length === 0) {
      useAppStore.setState({
        timeline: {
          ...current.timeline,
          responses: [
            {
              id: "demo-pattern-17",
              timestamp: 2,
              duration: 1,
              trackIndex: 0,
              data: { patternId: 17, color: "#ff0", customArg: "demo" },
              triggered: false,
            },
            {
              id: "demo-unassigned",
              timestamp: 4,
              duration: 1.5,
              trackIndex: 2,
              data: { patternId: 99, color: "#0ff", customArg: "unassigned" },
              triggered: false,
            },
          ],
        },
      });
    }
  }, [initialState, mockType]);
  return <>{children}</>;
}; 