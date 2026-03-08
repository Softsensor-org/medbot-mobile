import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import PreferencesScreen from '../app/(auth)/onboarding/preferences';
import { usePreferenceProfile, useUpdatePreferenceProfile } from '../src/hooks/useUser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('../src/hooks/useUser', () => ({
  usePreferenceProfile: jest.fn(),
  useUpdatePreferenceProfile: jest.fn(),
}));

jest.mock('../src/providers/ToastProvider', () => ({
  showToast: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('PreferencesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePreferenceProfile as jest.Mock).mockReturnValue({
      data: { essential: { budget: 'low', routine_depth: 'minimal', treatment_modality_comfort: 'clinical-only', avoid_list: ['Fragrance'] } },
      isLoading: false,
    });
    (useUpdatePreferenceProfile as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('renders existing preference data', () => {
    const { getByText } = render(<PreferencesScreen />, { wrapper });
    
    expect(getByText('Budget-friendly')).toBeTruthy();
  });

  it('updates preferences on save', async () => {
    const mockUpdate = jest.fn();
    (useUpdatePreferenceProfile as jest.Mock).mockReturnValue({ mutate: mockUpdate, isPending: false });
    
    const { getByText } = render(<PreferencesScreen />, { wrapper });
    
    // Select "Moderate" budget
    fireEvent.press(getByText('Moderate'));
    
    await act(async () => {
      fireEvent.press(getByText('Save Preferences'));
    });
    
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        essential: expect.objectContaining({
          budget: 'medium',
        }),
      }),
      expect.anything()
    );
  });
});
