import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import GoalJourneyScreen from '../app/(auth)/onboarding/goal-journey';
import { useGoalJourneys, useUpsertGoalJourney } from '../src/hooks/useUser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('../src/hooks/useUser', () => ({
  useGoalJourneys: jest.fn(),
  useUpsertGoalJourney: jest.fn(),
}));

jest.mock('../src/providers/ToastProvider', () => ({
  showToast: jest.fn(),
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

describe('GoalJourneyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGoalJourneys as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (useUpsertGoalJourney as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<GoalJourneyScreen />, { wrapper });
    
    expect(getByText('Your Future-You')).toBeTruthy();
    expect(getByPlaceholderText(/Clearer skin/)).toBeTruthy();
  });

  it('validates empty outcome', async () => {
    const { getByText } = render(<GoalJourneyScreen />, { wrapper });
    const { showToast } = require('../src/providers/ToastProvider');
    
    fireEvent.press(getByText('Initialize Success Plan'));
    
    expect(showToast).toHaveBeenCalledWith('error', 'Error', expect.stringContaining('describe your desired outcome'));
  });

  it('submits valid data', async () => {
    const mockUpsert = jest.fn();
    (useUpsertGoalJourney as jest.Mock).mockReturnValue({ mutate: mockUpsert, isPending: false });
    
    const { getByText, getByPlaceholderText } = render(<GoalJourneyScreen />, { wrapper });
    
    fireEvent.changeText(getByPlaceholderText(/Clearer skin/), 'Perfect skin');
    fireEvent.press(getByText('Budget Friendly'));
    
    await act(async () => {
      fireEvent.press(getByText('Initialize Success Plan'));
    });
    
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        target_outcome: 'Perfect skin',
        constraints: { budget: true }
      }),
      expect.anything()
    );
  });
});
