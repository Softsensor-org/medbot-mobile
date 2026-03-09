import React from 'react';
import { render } from '@testing-library/react-native';
import TimelineScreen from '../app/(auth)/timeline';
import { useTimeline } from '../src/hooks/useTimeline';
import { usePatientProgress } from '../src/hooks/useProgress';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('../src/hooks/useTimeline', () => ({
  useTimeline: jest.fn(),
}));

jest.mock('../src/hooks/useProgress', () => ({
  usePatientProgress: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('../src/components/common/CompareSlider', () => {
  const _React = require('react');
  const { View, Text } = require('react-native');
  return {
    CompareSlider: () => <View testID="compare-slider"><Text>Slider</Text></View>,
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('TimelineScreen', () => {
  const mockEvents = [
    { id: 'symptom-1', type: 'symptom', timestamp: '2026-03-05T10:00:00Z', title: 'Itching', description: 'Mild itching', metadata: { severity: 2 } },
    { id: 'routine-1', type: 'routine', timestamp: '2026-03-05T08:00:00Z', title: 'Morning Cleanse', description: '', metadata: { completion_rate: 1.0 } },
  ];

  const mockPhotos = [
    { id: 'photo-1', timestamp: '2026-03-05T09:00:00Z', url: 'http://test.com/photo1.jpg' },
    { id: 'photo-2', timestamp: '2026-03-04T09:00:00Z', url: 'http://test.com/photo2.jpg' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useTimeline as jest.Mock).mockReturnValue({
      data: { events: mockEvents },
      isLoading: false,
    });
    (usePatientProgress as jest.Mock).mockReturnValue({
      data: { photos: mockPhotos },
      isLoading: false,
    });
  });

  it('renders combined events grouped by week', () => {
    const { getByText, getAllByTestId } = render(<TimelineScreen />, { wrapper });
    
    expect(getByText('Itching')).toBeTruthy();
    expect(getByText('Morning Cleanse')).toBeTruthy();
    // Since we have 2 photos in same week, slider should be shown
    expect(getAllByTestId('compare-slider').length).toBeGreaterThan(0);
  });
});
