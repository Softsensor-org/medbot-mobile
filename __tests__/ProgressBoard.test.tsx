import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProgressBoard } from '../src/components/ProgressBoard';
import { usePatientProgress } from '../src/hooks/useProgress';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Share } from 'react-native';

const mockRouter = {
  push: jest.fn(),
};

// Mock the hook
jest.mock('../src/hooks/useProgress', () => ({
  usePatientProgress: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
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

jest.mock('../src/components/WeeklyReveal', () => ({
  WeeklyReveal: () => null,
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
    ritual_history: {
      total_logs: 18,
      active_days: 9,
      current_streak: 4,
      best_streak: 6,
      recent_days: [
        {
          date: '2026-03-06',
          completed_count: 2,
          avg_completion_rate: 0.75,
          routine_names: ['Evening Reset', 'Barrier Repair'],
        },
        {
          date: '2026-03-05',
          completed_count: 1,
          avg_completion_rate: 0.5,
          routine_names: [],
        },
      ],
    },
    insight_modules: [
      {
        key: 'consistency',
        title: 'Consistency Trend',
        value: '4-day rebound',
        detail: 'Adherence recovered after one missed day.',
        tone: 'positive',
      },
      {
        key: 'symptom_watch',
        title: 'Symptom Watch',
        value: 'Monitor dryness',
        detail: 'Dryness clustered on lower-completion days.',
        tone: 'attention',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  afterEach(async () => {
    await queryClient.cancelQueries();
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
    expect(getByText('Insight Pack')).toBeTruthy();
    expect(getByText('Ritual History')).toBeTruthy();
    expect(getByText('Progress Photos')).toBeTruthy();
    expect(getByText('Streak Rescue')).toBeTruthy();
    expect(getByText('PHI-Safe Share Card')).toBeTruthy();
  });

  it('renders insight pack cards and ritual history details', () => {
    (usePatientProgress as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    const { getByTestId, getByText } = render(<ProgressBoard />, { wrapper });

    expect(getByTestId('insight-pack-section')).toBeTruthy();
    expect(getByTestId('insight-module-consistency')).toBeTruthy();
    expect(getByText('4-day rebound')).toBeTruthy();
    expect(getByText('Dryness clustered on lower-completion days.')).toBeTruthy();

    expect(getByTestId('ritual-history-section')).toBeTruthy();
    expect(getByText('Total Logs')).toBeTruthy();
    expect(getByText('18')).toBeTruthy();
    expect(getByText('Evening Reset, Barrier Repair')).toBeTruthy();
    expect(getByText('No routine names captured.')).toBeTruthy();
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

  it('routes symptom bars through the grouped auth timeline path', () => {
    (usePatientProgress as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    const { getAllByText } = render(<ProgressBoard />, { wrapper });

    fireEvent.press(getAllByText('03/01')[0]);

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/(auth)/timeline',
      params: { date: '2026-03-01' },
    });
  });
});
