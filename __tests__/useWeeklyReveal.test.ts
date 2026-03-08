import { renderHook } from '@testing-library/react-native';
import { useWeeklyReveal } from '../src/hooks/useWeeklyReveal';
import { usePatientProgress } from '../src/hooks/useProgress';

// Mocks
jest.mock('../src/hooks/useProgress', () => ({
  usePatientProgress: jest.fn(),
}));

describe('useWeeklyReveal', () => {
  const mockData = {
    summary: { adherence_rate: 0.9, symptom_count: 5, photo_count: 2, active_routines: 2 },
    symptoms: [
      { date: '2026-03-01', severity: 4, count: 1 },
      { date: '2026-03-07', severity: 2, count: 1 },
    ],
    adherence: Array(7).fill({ date: '2026-03-01', rate: 1 }),
    photos: [
      { id: 'after', timestamp: '2026-03-07T10:00:00Z', url: 'after.jpg' },
      { id: 'before', timestamp: '2026-03-01T10:00:00Z', url: 'before.jpg' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates improving status when severity drops', () => {
    (usePatientProgress as jest.Mock).mockReturnValue({ data: mockData, isLoading: false });
    const { result } = renderHook(() => useWeeklyReveal());
    
    expect(result.current.insight?.status).toBe('improving');
    expect(result.current.insight?.confidence).toBeGreaterThan(0.5);
  });

  it('returns low_data status when events are sparse', () => {
    (usePatientProgress as jest.Mock).mockReturnValue({ 
      data: { ...mockData, symptoms: [], adherence: [] }, 
      isLoading: false 
    });
    const { result } = renderHook(() => useWeeklyReveal());
    
    expect(result.current.insight?.status).toBe('low_data');
    expect(result.current.insight?.confidence).toBeLessThan(0.4);
  });

  it('correctly identifies before and after photos', () => {
    (usePatientProgress as jest.Mock).mockReturnValue({ data: mockData, isLoading: false });
    const { result } = renderHook(() => useWeeklyReveal());
    
    expect(result.current.insight?.comparison.before?.id).toBe('before');
    expect(result.current.insight?.comparison.after?.id).toBe('after');
  });
});
