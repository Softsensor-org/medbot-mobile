import { renderHook, act } from '@testing-library/react-native';
import { useAutopilot } from '../src/hooks/useAutopilot';
import { useRoutineAssignments } from '../src/hooks/useRoutineAssignments';
import { useCompleteAssignment, useDeferAssignment } from '../src/hooks/useRoutineActions';
import { usePatientProgress } from '../src/hooks/useProgress';

// Mocks
jest.mock('../src/hooks/useRoutineAssignments', () => ({
  useRoutineAssignments: jest.fn(),
}));

jest.mock('../src/hooks/useRoutineActions', () => ({
  useCompleteAssignment: jest.fn(),
  useDeferAssignment: jest.fn(),
}));

jest.mock('../src/hooks/useProgress', () => ({
  usePatientProgress: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

describe('useAutopilot', () => {
  const mockRoutines = [
    { id: 1, routine_name: 'Test Routine', status: 'active' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRoutineAssignments as jest.Mock).mockReturnValue({ data: mockRoutines, isLoading: false });
    (usePatientProgress as jest.Mock).mockReturnValue({ data: { photos: [{ id: 'p1' }] }, isLoading: false });
    (useCompleteAssignment as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    (useDeferAssignment as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
  });

  it('identifies the first active routine as the current step', () => {
    const { result } = renderHook(() => useAutopilot());
    expect(result.current.currentStep.title).toBe('Test Routine');
    expect(result.current.remainingRoutines).toBe(1);
  });

  it('transitions to complete state when no routines remain', () => {
    (useRoutineAssignments as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    const { result } = renderHook(() => useAutopilot());
    expect(result.current.currentStep.type).toBe('complete');
  });

  it('calls complete mutation on handleDone', async () => {
    const mockComplete = jest.fn();
    (useCompleteAssignment as jest.Mock).mockReturnValue({ mutateAsync: mockComplete, isPending: false });
    
    const { result } = renderHook(() => useAutopilot());
    
    await act(async () => {
      await result.current.handleDone();
    });
    
    expect(mockComplete).toHaveBeenCalledWith(expect.objectContaining({
      assignmentId: 1,
      payload: expect.objectContaining({ action: 'complete' })
    }));
  });
});
