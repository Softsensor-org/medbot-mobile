import { renderHook } from '@testing-library/react-native';
import { useTrajectory } from '../src/hooks/useTrajectory';
import { useGoalJourneys } from '../src/hooks/useUser';
import { usePatientProgress } from '../src/hooks/useProgress';
import { addDays, subDays } from 'date-fns';

// Mocks
jest.mock('../src/hooks/useUser', () => ({
  useGoalJourneys: jest.fn(),
}));

jest.mock('../src/hooks/useProgress', () => ({
  usePatientProgress: jest.fn(),
}));

describe('useTrajectory', () => {
  const mockJourney = {
    id: 1,
    target_outcome: 'Perfect skin',
    target_date: addDays(new Date(), 90).toISOString(),
    created_at: subDays(new Date(), 10).toISOString(),
    constraints: {},
    status: 'active'
  };

  const mockProgress = {
    summary: {
      adherence_rate: 0.8,
      photo_count: 4,
      symptom_count: 5,
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates trajectory data correctly', () => {
    (useGoalJourneys as jest.Mock).mockReturnValue({ data: [mockJourney] });
    (usePatientProgress as jest.Mock).mockReturnValue({ data: mockProgress, isLoading: false });

    const { result } = renderHook(() => useTrajectory());
    
    expect(result.current.trajectory?.goalOutcome).toBe('Perfect skin');
    expect(result.current.trajectory?.daysRemaining).toBe(90);
    expect(result.current.trajectory?.progressPercent).toBeGreaterThan(0);
    expect(result.current.trajectory?.confidenceScore).toBeGreaterThan(0.5);
  });

  it('returns null when no journey exists', () => {
    (useGoalJourneys as jest.Mock).mockReturnValue({ data: [] });
    (usePatientProgress as jest.Mock).mockReturnValue({ data: mockProgress, isLoading: false });

    const { result } = renderHook(() => useTrajectory());
    expect(result.current.trajectory).toBeNull();
  });
});
