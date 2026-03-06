import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SymptomLogScreen from '../app/(auth)/intake/symptom-log';
import { useSymptomTypes, useLogSymptom } from '../src/hooks/useSymptomLogging';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { showToast } from '../src/providers/ToastProvider';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../src/hooks/useSymptomLogging', () => ({
  useSymptomTypes: jest.fn(),
  useLogSymptom: jest.fn(),
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

describe('SymptomLogScreen', () => {
  const mockRouter = { back: jest.fn(), push: jest.fn() };
  const mockSymptomTypes = [
    { id: 1, name: 'Rash', description: 'Red itchy skin', category: 'Derm' },
    { id: 2, name: 'Fever', description: 'High temperature', category: 'General' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ sessionId: 'session-123' });
    (useSymptomTypes as jest.Mock).mockReturnValue({ data: mockSymptomTypes, isLoading: false });
    (useLogSymptom as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it('renders symptom types after loading', () => {
    const { getByText } = render(<SymptomLogScreen />, { wrapper });
    
    // Open modal
    fireEvent.press(getByText('Select symptom type...'));
    
    expect(getByText('Rash')).toBeTruthy();
    expect(getByText('Fever')).toBeTruthy();
  });

  it('submits symptom log successfully', async () => {
    const mockMutate = jest.fn((data, callbacks) => {
      callbacks.onSuccess();
    });
    (useLogSymptom as jest.Mock).mockReturnValue({ mutate: mockMutate, isPending: false });

    const { getByText, getByPlaceholderText, getAllByText } = render(<SymptomLogScreen />, { wrapper });

    // Select type
    fireEvent.press(getByText('Select symptom type...'));
    fireEvent.press(getByText('Rash'));

    // Set notes
    const notesInput = getByPlaceholderText('Add any additional details...');
    fireEvent.changeText(notesInput, 'It is on my left arm');

    // Submit - pick the button one
    const submitButtons = getAllByText('Log Symptom');
    fireEvent.press(submitButtons[submitButtons.length - 1]);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        symptom_type_id: 1,
        notes: 'It is on my left arm',
        session_id: 'session-123',
      }),
      expect.any(Object)
    );

    expect(showToast).toHaveBeenCalledWith('success', 'Success', 'Symptom logged successfully');
  });

  it('handles submission error', async () => {
    const mockMutate = jest.fn((data, callbacks) => {
      callbacks.onError(new Error('Failed'));
    });
    (useLogSymptom as jest.Mock).mockReturnValue({ mutate: mockMutate, isPending: false });

    const { getByText, getAllByText } = render(<SymptomLogScreen />, { wrapper });

    fireEvent.press(getByText('Select symptom type...'));
    fireEvent.press(getByText('Rash'));
    
    const submitButtons = getAllByText('Log Symptom');
    fireEvent.press(submitButtons[submitButtons.length - 1]);

    expect(showToast).toHaveBeenCalledWith('error', 'Error', 'Failed to log symptom');
  });
});
