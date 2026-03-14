import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { useSafetyGate } from '../src/hooks/useSafetyGate';
import { useWeeklyReveal } from '../src/hooks/useWeeklyReveal';
import { useSessions } from '../src/hooks/useSessions';
import { useSymptoms } from '../src/hooks/useSymptomLogging';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('../src/hooks/useWeeklyReveal', () => ({
  useWeeklyReveal: jest.fn(),
}));

jest.mock('../src/hooks/useSessions', () => ({
  useSessions: jest.fn(),
}));

jest.mock('../src/hooks/useSymptomLogging', () => ({
  useSymptoms: jest.fn(),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useSafetyGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSessions as jest.Mock).mockReturnValue({ data: [] });
    (useSymptoms as jest.Mock).mockReturnValue({ data: [], isLoading: false });
  });

  it('triggers red_flag safety restriction when severity is high', () => {
    (useWeeklyReveal as jest.Mock).mockReturnValue({ insight: { status: 'stable' } });
    (useSymptoms as jest.Mock).mockReturnValue({ data: [{ severity: 5 }], isLoading: false });
    
    const { result } = renderHook(() => useSafetyGate(), { wrapper });
    
    expect(result.current.safety.isSafe).toBe(false);
    expect(result.current.safety.reason).toBe('red_flag');
    expect(result.current.safety.severity).toBe('high');
  });

  it('triggers regression safety restriction when status is regressing', () => {
    (useWeeklyReveal as jest.Mock).mockReturnValue({ insight: { status: 'regressing' } });
    (useSymptoms as jest.Mock).mockReturnValue({ data: [{ severity: 2 }], isLoading: false });
    
    const { result } = renderHook(() => useSafetyGate(), { wrapper });
    
    expect(result.current.safety.isSafe).toBe(false);
    expect(result.current.safety.reason).toBe('regression');
  });

  it('triggers backend_restriction when urgent session exists', () => {
    (useWeeklyReveal as jest.Mock).mockReturnValue({ insight: { status: 'stable' } });
    (useSymptoms as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useSessions as jest.Mock).mockReturnValue({
        data: [{ session_id: 's1', status: 'assigned' }]
    });

    const { result } = renderHook(() => useSafetyGate(), { wrapper });
    
    expect(result.current.safety.isSafe).toBe(false);
    expect(result.current.safety.reason).toBe('backend_restriction');
  });

  it('is safe when no red flags or regression present', () => {
    (useWeeklyReveal as jest.Mock).mockReturnValue({ insight: { status: 'improving', confidence: 0.8 } });
    (useSymptoms as jest.Mock).mockReturnValue({ data: [{ severity: 2 }], isLoading: false });
    
    const { result } = renderHook(() => useSafetyGate(), { wrapper });
    
    expect(result.current.safety.isSafe).toBe(true);
  });

  it('stays safe when aggregated progress would have been high but raw symptoms are moderate', () => {
    (useWeeklyReveal as jest.Mock).mockReturnValue({ insight: { status: 'stable', confidence: 0.8 } });
    (useSymptoms as jest.Mock).mockReturnValue({ data: [{ severity: 3.5 }], isLoading: false });

    const { result } = renderHook(() => useSafetyGate(), { wrapper });

    expect(result.current.safety.isSafe).toBe(true);
  });
});
