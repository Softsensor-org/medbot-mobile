import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import RoutinesScreen from '../app/(auth)/(tabs)/routines';
import { useRoutineAssignments } from '../src/hooks/useRoutineAssignments';
import { useCompleteAssignment, useDeferAssignment } from '../src/hooks/useRoutineActions';
import { useRoutines } from '../src/hooks/useRoutines';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSafetyGate } from '../src/hooks/useSafetyGate';

// Mocks
jest.mock('../src/hooks/useRoutineAssignments', () => ({
  useRoutineAssignments: jest.fn(),
}));

jest.mock('../src/hooks/useRoutineActions', () => ({
  useCompleteAssignment: jest.fn(),
  useDeferAssignment: jest.fn(),
}));

jest.mock('../src/hooks/useRoutines', () => ({
  useRoutines: jest.fn(),
}));

jest.mock('../src/hooks/useSafetyGate', () => ({
  useSafetyGate: jest.fn(),
}));

jest.mock('../src/components/common/NativeDateTimePicker', () => {
  const _ReactNode = require('react');
  const { View, Text, TextInput } = require('react-native');
  type MockPickerProps = {
    label: string;
    onChange: (value: Date) => void;
    testID?: string;
  };
  return {
    NativeDateTimePicker: ({ label, onChange, testID }: MockPickerProps) => (
      <View>
        <Text>{label}</Text>
        <TextInput
          testID={testID}
          placeholder={label}
          onChangeText={(text: string) => onChange(new Date(text))}
        />
      </View>
    ),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('RoutinesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRoutineAssignments as jest.Mock).mockReturnValue({
      data: [
        { id: 1, routine_id: 10, routine_name: 'Morning Routine', status: 'active', routine_description: 'Daily skin care' },
      ],
      isLoading: false,
    });
    (useRoutines as jest.Mock).mockReturnValue({
      data: [
        {
          id: 10,
          name: 'Morning Routine',
          description: 'Daily skin care',
          active: true,
          day_part: 'morning',
          recurrence: { frequency: 'daily' },
          steps: [
            { id: 1, routine_id: 10, name: 'Cleanser', description: 'Wash and pat dry', step_order: 1 },
            { id: 2, routine_id: 10, name: 'Moisturizer', description: 'Seal in hydration', step_order: 2 },
          ],
        },
      ],
      error: null,
    });
    (useCompleteAssignment as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useDeferAssignment as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
    (useSafetyGate as jest.Mock).mockReturnValue({ safety: { isSafe: true }, isLoading: false });
  });

  it('renders active assignments', () => {
    const { getByText, getAllByText } = render(<RoutinesScreen />, { wrapper });
    expect(getByText('Morning Routine')).toBeTruthy();
    expect(getByText('Daily skin care')).toBeTruthy();
    expect(getByText('Cleanser')).toBeTruthy();
    expect(getAllByText('Every day').length).toBeGreaterThan(0);
  });

  it('opens commit box on defer', () => {
    const { getByText, getByTestId } = render(<RoutinesScreen />, { wrapper });
    
    fireEvent.press(getByTestId('routine-defer-button'));
    
    expect(getByText('Commit Box')).toBeTruthy();
  });

  it('shows date picker when specific time is selected in commit box', () => {
    const { getByText, getByPlaceholderText } = render(<RoutinesScreen />, { wrapper });
    
    fireEvent.press(getByText('Defer (Commit Box)'));
    
    // Select "Specific time" chip
    fireEvent.press(getByText('Specific time'));
    
    expect(getByPlaceholderText('Target time')).toBeTruthy();
  });

  it('submits defer with specific time', async () => {
    const mockDefer = jest.fn();
    (useDeferAssignment as jest.Mock).mockReturnValue({ mutate: mockDefer, isPending: false });
    
    const { getByText, getByPlaceholderText } = render(<RoutinesScreen />, { wrapper });
    
    fireEvent.press(getByText('Defer (Commit Box)'));
    fireEvent.press(getByText('Specific time'));
    
    fireEvent.changeText(getByPlaceholderText('Target time'), '2026-03-10T10:00:00Z');
    
    await act(async () => {
      fireEvent.press(getByText('Submit defer'));
    });
    
    expect(mockDefer).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          reschedule_intent: expect.objectContaining({
            type: 'specific_time',
          }),
        }),
      }),
      expect.anything()
    );
  });

  it('renders the empty state when no assignments are available', () => {
    (useRoutineAssignments as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (useRoutines as jest.Mock).mockReturnValue({
      data: [],
      error: null,
    });

    const { getByText } = render(<RoutinesScreen />, { wrapper });

    expect(getByText('No rituals are ready right now')).toBeTruthy();
  });
});
