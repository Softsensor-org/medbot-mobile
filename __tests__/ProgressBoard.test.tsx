import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProgressBoard } from '../src/components/ProgressBoard';
import { usePatientProgress } from '../src/hooks/useProgress';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Share } from 'react-native';

// Mock the hook
jest.mock('../src/hooks/useProgress', () => ({
  usePatientProgress: jest.fn(),
}));

jest.mock('../src/hooks/useEngagementSettings', () => ({
  useEngagementSettings: () => ({
    hapticsEnabled: true,
    setHapticsEnabled: jest.fn(),
  }),
}));

// Mock icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Ionicons: 'Ionicons',
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
    },
    mutations: {
      gcTime: Infinity,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ProgressBoard', () => {
  const mockData = {
    patient_id: 'test-user',
    period_days: 30,
    summary: {
      symptom_count: 5,
      adherence_rate: 0.85,
      photo_count: 2,
      active_routines: 3,
    },
    symptoms: [
      { date: '2026-03-01', severity: 3, count: 1 },
    ],
    adherence: [
      { date: '2026-03-01', rate: 1.0 },
      { date: '2026-03-02', rate: 0.0 },
    ],
    photos: [
      { id: '1', timestamp: '2026-03-01T10:00:00Z', url: 'http://test.com/1.jpg' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders loading state', () => {
    (usePatientProgress as jest.Mock).mockReturnValue({
      isLoading: true,
    });

    const { getByTestId } = render(<ProgressBoard />, { wrapper });
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders error state', () => {
    (usePatientProgress as jest.Mock).mockReturnValue({
      isError: true,
      refetch: jest.fn(),
    });

    const { getByText } = render(<ProgressBoard />, { wrapper });
    expect(getByText('Failed to load progress data')).toBeTruthy();
  });

  it('renders data correctly', () => {
    (usePatientProgress as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    const { getByText, getByTestId } = render(<ProgressBoard />, { wrapper });
    
    // Note: Numbers in Text components are often stringified in children
    expect(getByTestId('adherence-value').children.join('')).toBe('85%');
    expect(getByTestId('symptom-value').children.join('')).toBe('5');
    expect(getByTestId('photo-value').children.join('')).toBe('2');
    expect(getByTestId('routine-value').children.join('')).toBe('3');
    
    // Check sections
    expect(getByText('Symptom Severity')).toBeTruthy();
    expect(getByText('Routine Adherence')).toBeTruthy();
    expect(getByText('Progress Photos')).toBeTruthy();
    expect(getByText('Streak Rescue')).toBeTruthy();
    expect(getByText('PHI-Safe Share Card')).toBeTruthy();
  });

  it('handles streak rescue transition and safe share action', async () => {
    (usePatientProgress as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    const { getByTestId, getByText } = render(<ProgressBoard />, { wrapper });

    fireEvent.press(getByTestId('streak-rescue-start-button'));
    expect(getByTestId('streak-rescue-complete-button')).toBeTruthy();

    fireEvent.press(getByTestId('streak-rescue-complete-button'));
    expect(getByTestId('streak-rescue-success')).toBeTruthy();

    fireEvent.press(getByTestId('phi-safe-share-button'));
    await waitFor(() => {
      expect(Share.share).toHaveBeenCalled();
      expect(getByTestId('phi-safe-share-status')).toBeTruthy();
    });
    expect(getByText('Shared safely.')).toBeTruthy();
  });
});
