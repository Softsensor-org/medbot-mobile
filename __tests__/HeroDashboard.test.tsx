import React from 'react';
import { render } from '@testing-library/react-native';
import { HeroDashboard } from '../src/components/HeroDashboard';
import { usePatientProgress } from '../src/hooks/useProgress';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../src/hooks/useProgress', () => ({
  usePatientProgress: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('HeroDashboard', () => {
  const mockData = {
    summary: {
      adherence_rate: 0.85,
      symptom_count: 5,
      photo_count: 3,
      active_routines: 2,
    },
    photos: [
      { id: '1', timestamp: '2026-03-05T10:00:00Z', url: 'http://test.com/1.jpg' }
    ],
    symptoms: [
      { date: '2026-03-05', severity: 2, count: 1 },
      { date: '2026-03-04', severity: 3, count: 1 },
    ],
    adherence: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientProgress as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
    });
  });

  it('renders progress summary and latest photo', () => {
    const { getByText } = render(<HeroDashboard />, { wrapper });
    
    expect(getByText('85%')).toBeTruthy();
    expect(getByText('Improving')).toBeTruthy(); // 2 < 3 severity
    expect(getByText('March 5th, 2026')).toBeTruthy();
  });

  it('renders quick action buttons', () => {
    const { getByText } = render(<HeroDashboard />, { wrapper });
    
    expect(getByText('Symptom')).toBeTruthy();
    expect(getByText('Photo')).toBeTruthy();
    expect(getByText('Routines')).toBeTruthy();
  });
});
