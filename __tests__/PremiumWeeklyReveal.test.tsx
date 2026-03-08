import React from 'react';
import { render } from '@testing-library/react-native';
import { PremiumWeeklyReveal } from '../src/components/PremiumWeeklyReveal';
import { useWeeklyReveal } from '../src/hooks/useWeeklyReveal';
import { useTrajectory } from '../src/hooks/useTrajectory';
import { useSafetyGate } from '../src/hooks/useSafetyGate';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text } from 'react-native';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('../src/hooks/useWeeklyReveal', () => ({
  useWeeklyReveal: jest.fn(),
}));

jest.mock('../src/hooks/useTrajectory', () => ({
  useTrajectory: jest.fn(),
}));

jest.mock('../src/hooks/useSafetyGate', () => ({
  useSafetyGate: jest.fn(),
}));

jest.mock('../src/hooks/useMotion', () => ({
  useMotion: () => ({ reduceMotion: false }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('../src/components/common/CompareSlider', () => {
  const ReactNode = require('react');
  const { View: MockView, Text: MockText } = require('react-native');
  return {
    CompareSlider: () => <MockView testID="compare-slider"><MockText>Slider</MockText></MockView>,
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('PremiumWeeklyReveal', () => {
  const mockInsight = {
    status: 'improving',
    confidence: 0.9,
    summary: 'Clear clinical improvement.',
    recommendation: 'Keep going!',
    cta: { label: 'Continue Routine', route: '/routines' },
    comparison: {
      before: { url: 'before.jpg', timestamp: '2026-03-01T10:00:00Z' },
      after: { url: 'after.jpg', timestamp: '2026-03-07T10:00:00Z' },
    }
  };

  const mockTrajectory = {
    goalOutcome: 'Clear Skin',
    daysRemaining: 45,
    progressPercent: 60,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useWeeklyReveal as jest.Mock).mockReturnValue({ insight: mockInsight, isLoading: false });
    (useTrajectory as jest.Mock).mockReturnValue({ trajectory: mockTrajectory, isLoading: false });
    (useSafetyGate as jest.Mock).mockReturnValue({ safety: { isSafe: true }, isLoading: false });
  });

  it('renders editorial header and summary', () => {
    const { getByText } = render(<PremiumWeeklyReveal />, { wrapper });
    
    expect(getByText('The Reveal')).toBeTruthy();
    expect(getByText('Clear clinical improvement.')).toBeTruthy();
  });

  it('renders trajectory data from useTrajectory', () => {
    const { getByText } = render(<PremiumWeeklyReveal />, { wrapper });
    
    expect(getByText('"Clear Skin"')).toBeTruthy();
    expect(getByText('45')).toBeTruthy();
    expect(getByText('60%')).toBeTruthy();
  });

  it('renders the call to action', () => {
    const { getByText } = render(<PremiumWeeklyReveal />, { wrapper });
    
    expect(getByText('Continue Routine')).toBeTruthy();
  });
});
