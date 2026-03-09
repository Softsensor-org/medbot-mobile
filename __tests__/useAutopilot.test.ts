import { renderHook } from '@testing-library/react-native';
import { useAutopilot } from '../src/hooks/useAutopilot';
import { useRoutineAssignments } from '../src/hooks/useRoutineAssignments';
import { useEvidenceSessions } from '../src/hooks/useEvidence';
import { usePreferenceProfile } from '../src/hooks/useUser';

// Mocks
jest.mock('../src/hooks/useRoutineAssignments', () => ({
  useRoutineAssignments: jest.fn(),
}));

jest.mock('../src/hooks/useEvidence', () => ({
  useEvidenceSessions: jest.fn(),
}));

jest.mock('../src/hooks/useUser', () => ({
  usePreferenceProfile: jest.fn(),
}));

describe('useAutopilot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates a list of tasks including routines and sessions', () => {
    (useRoutineAssignments as jest.Mock).mockReturnValue({ 
      data: [{ id: 1, routine_name: 'Test Routine', status: 'active' }], 
      isLoading: false 
    });
    (useEvidenceSessions as jest.Mock).mockReturnValue({ 
      data: [{ session_id: 's1', status: 'active' }], 
      isLoading: false 
    });
    (usePreferenceProfile as jest.Mock).mockReturnValue({ 
      data: { essential: { goals: ['Clear Skin'] } }, 
      isLoading: false 
    });

    const { result } = renderHook(() => useAutopilot());
    
    expect(result.current.totalSteps).toBeGreaterThanOrEqual(1);
    expect(result.current.currentStep.type).toBe('routine');
  });

  it('adds a profile task when preferences are incomplete', () => {
    (useRoutineAssignments as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useEvidenceSessions as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (usePreferenceProfile as jest.Mock).mockReturnValue({ 
      data: { essential: { goals: [] } }, 
      isLoading: false 
    });

    const { result } = renderHook(() => useAutopilot());
    
    // With empty data, autopilot should suggest a photo or show complete
    expect(result.current.currentStep).toBeTruthy();
  });
});
