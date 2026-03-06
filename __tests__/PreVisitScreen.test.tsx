import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PreVisitScreen from '../app/(auth)/intake/pre-visit';
import {
  useAppointmentContext,
  useSetAppointmentContext,
  usePrevisitQuestions,
  useSubmitPrevisitAnswer,
  usePrevisitReadiness,
} from '../src/hooks/useWellness';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../src/hooks/useWellness', () => ({
  useAppointmentContext: jest.fn(),
  useSetAppointmentContext: jest.fn(),
  usePrevisitQuestions: jest.fn(),
  useSubmitPrevisitAnswer: jest.fn(),
  usePrevisitReadiness: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('../src/providers/ToastProvider', () => ({
  showToast: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('PreVisitScreen', () => {
  const mockRouter = { back: jest.fn() };
  const mockSessionId = 'session-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ sessionId: mockSessionId });
    
    // Provide default implementations
    (useAppointmentContext as jest.Mock).mockReturnValue({ data: null, isLoading: false });
    (usePrevisitReadiness as jest.Mock).mockReturnValue({ data: null, isLoading: false });
    (usePrevisitQuestions as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useSubmitPrevisitAnswer as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useSetAppointmentContext as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('renders step 1 (appointment details) when no appointment exists', () => {
    const { getByText, getByPlaceholderText } = render(<PreVisitScreen />, { wrapper });

    expect(getByText('Appointment Details')).toBeTruthy();
    expect(getByPlaceholderText('e.g. Downtown Skin Clinic')).toBeTruthy();
  });

  it('navigates to step 2 after setting appointment', async () => {
    (useAppointmentContext as jest.Mock).mockReturnValue({ data: null, isLoading: false });
    (usePrevisitReadiness as jest.Mock).mockReturnValue({ data: null, isLoading: false });
    const mockSetAppt = jest.fn((data, callbacks) => {
      // Simulate success and update mock for next render
      (useAppointmentContext as jest.Mock).mockReturnValue({ 
        data: { appointment_type: 'clinic', appointment_datetime: '2026-03-10', clinic_location: 'Clinic' }, 
        isLoading: false 
      });
      callbacks.onSuccess();
    });
    (useSetAppointmentContext as jest.Mock).mockReturnValue({ mutate: mockSetAppt, isPending: false });
    (usePrevisitQuestions as jest.Mock).mockReturnValue({ data: [], isLoading: false });

    const { getByText, getByPlaceholderText } = render(<PreVisitScreen />, { wrapper });

    fireEvent.press(getByText('clinic'));
    fireEvent.changeText(getByPlaceholderText('e.g. 2026-03-15 10:30'), '2026-03-10');
    fireEvent.changeText(getByPlaceholderText('e.g. Downtown Skin Clinic'), 'Clinic');
    
    await act(async () => {
      fireEvent.press(getByText('Next'));
    });

    expect(mockSetAppt).toHaveBeenCalled();
  });

  it('renders questions in step 2', () => {
    (useAppointmentContext as jest.Mock).mockReturnValue({ 
      data: { appointment_type: 'clinic' }, 
      isLoading: false 
    });
    (usePrevisitReadiness as jest.Mock).mockReturnValue({ 
      data: { readiness_pct: 0.5, answers_provided: [1] }, 
      isLoading: false 
    });
    (usePrevisitQuestions as jest.Mock).mockReturnValue({ 
      data: [{ id: 1, text: 'Question 1', required: true }], 
      isLoading: false 
    });
    (useSubmitPrevisitAnswer as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });

    const { getByText } = render(<PreVisitScreen />, { wrapper });

    expect(getByText('Question 1 *')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
  });
});
