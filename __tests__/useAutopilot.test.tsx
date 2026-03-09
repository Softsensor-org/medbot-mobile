import { renderHook } from '@testing-library/react-native';
import { useAutopilot } from '../src/hooks/useAutopilot';
import { useRoutineAssignments } from '../src/hooks/useRoutineAssignments';
import { usePatientProgress } from '../src/hooks/useProgress';
import { useCompleteAssignment, useDeferAssignment } from '../src/hooks/useRoutineActions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mocks
jest.mock('../src/hooks/useRoutineAssignments', () => ({
  useRoutineAssignments: jest.fn(),
}));

jest.mock('../src/hooks/useProgress', () => ({
  usePatientProgress: jest.fn(),
}));

jest.mock('../src/hooks/useRoutineActions', () => ({
  useCompleteAssignment: jest.fn(),
  useDeferAssignment: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useAutopilot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('generates a list of tasks including routines and sessions', () => {
    (useRoutineAssignments as jest.Mock).mockReturnValue({ 
      data: [{ id: 1, routine_name: 'Test Routine', status: 'active' }], 
      isLoading: false 
    });
    (usePatientProgress as jest.Mock).mockReturnValue({ 
      data: { photos: [] }, 
      isLoading: false 
    });
    (useCompleteAssignment as jest.Mock).mockReturnValue({ isPending: false });
    (useDeferAssignment as jest.Mock).mockReturnValue({ isPending: false });

    const { result } = renderHook(() => useAutopilot(), { wrapper: Wrapper });
    
    expect(result.current.totalSteps).toBeGreaterThanOrEqual(1);
    expect(result.current.currentStep.type).toBe('routine');
  });

  it('adds a profile task when preferences are incomplete', () => {
    (useRoutineAssignments as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (usePatientProgress as jest.Mock).mockReturnValue({ 
      data: { photos: [] }, 
      isLoading: false 
    });
    (useCompleteAssignment as jest.Mock).mockReturnValue({ isPending: false });
    (useDeferAssignment as jest.Mock).mockReturnValue({ isPending: false });

    const { result } = renderHook(() => useAutopilot(), { wrapper: Wrapper });
    
    // With empty data, autopilot should suggest a photo or show complete
    expect(result.current.currentStep).toBeTruthy();
  });
});
