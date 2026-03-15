import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import RoutinesScreen from '../app/(auth)/(tabs)/routines';
import { useRoutineAssignments } from '../src/hooks/useRoutineAssignments';
import { useCompleteAssignment, useDeferAssignment } from '../src/hooks/useRoutineActions';
import { useRoutineIntelligence } from '../src/hooks/useRoutineIntelligence';
import { useRoutines } from '../src/hooks/useRoutines';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSafetyGate } from '../src/hooks/useSafetyGate';
import { hapticService } from '../src/api/HapticService';

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

jest.mock('../src/hooks/useRoutineIntelligence', () => ({
  useRoutineIntelligence: jest.fn(),
}));

jest.mock('../src/hooks/useSafetyGate', () => ({
  useSafetyGate: jest.fn(),
}));

jest.mock('../src/api/HapticService', () => ({
  hapticService: {
    triggerSuccess: jest.fn(),
    triggerWarning: jest.fn(),
    triggerError: jest.fn(),
    triggerSelection: jest.fn(),
  },
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
        {
          id: 1,
          routine_id: 10,
          routine_name: 'Morning Routine',
          status: 'active',
          routine_description: 'Daily skin care',
          recovery: {
            state: 'on_track',
            headline: 'Ready to complete',
            detail: 'Follow the authored steps in order and use snooze or skip if today shifts.',
            recommended_action: 'complete',
            provider_follow_up: false,
          },
        },
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
    (useRoutineIntelligence as jest.Mock).mockReturnValue({
      data: {
        patient_id: 'patient-1',
        focus: {
          kind: 'current',
          routine_id: 10,
          assignment_id: 1,
          routine_name: 'Morning Routine',
          estimated_duration_minutes: 4,
          estimated_duration_basis: 'Estimated from 2 authored steps.',
        },
        adherence: {
          adherence_rate_7d: 0.86,
          logged_events_7d: 6,
          deferred_or_skipped_7d: 1,
          current_streak: 4,
          longest_streak: 7,
          streak_routine_id: 10,
          streak_routine_name: 'Morning Routine',
        },
        recovery: {
          state: 'on_track',
          headline: 'Ready to complete',
          detail: 'Follow the authored steps in order and use snooze or skip if today shifts.',
          recommended_action: 'complete',
          provider_follow_up: false,
        },
        generated_at: '2026-03-13T10:00:00Z',
      },
    });
    (useCompleteAssignment as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      syncStatus: undefined,
      syncError: null,
      retrySync: jest.fn(),
    });
    (useDeferAssignment as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      syncStatus: undefined,
      syncError: null,
      retrySync: jest.fn(),
    });
    (useSafetyGate as jest.Mock).mockReturnValue({ safety: { isSafe: true }, isLoading: false });
  });

  it('renders active assignments', () => {
    const { getByText, getAllByText } = render(<RoutinesScreen />, { wrapper });
    expect(getAllByText('Morning Routine').length).toBeGreaterThan(0);
    expect(getByText('Daily skin care')).toBeTruthy();
    expect(getByText('Cleanser')).toBeTruthy();
    expect(getAllByText('Every day').length).toBeGreaterThan(0);
  });

  it('renders the routine intelligence summary', () => {
    const { getByTestId, getByText } = render(<RoutinesScreen />, { wrapper });

    expect(getByTestId('routine-intelligence-card')).toBeTruthy();
    expect(getByText('Current ritual focus')).toBeTruthy();
    expect(getByText('86%')).toBeTruthy();
    expect(getByText('4 days')).toBeTruthy();
    expect(getByText('~4 min')).toBeTruthy();
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
          action: 'snooze',
          reschedule_intent: expect.objectContaining({
            type: 'specific_time',
          }),
        }),
      }),
      expect.anything()
    );
  });

  it('submits skip recovery action when skip for now is selected', async () => {
    const mockDefer = jest.fn();
    (useDeferAssignment as jest.Mock).mockReturnValue({ mutate: mockDefer, isPending: false });

    const { getByText } = render(<RoutinesScreen />, { wrapper });

    fireEvent.press(getByText('Defer (Commit Box)'));
    fireEvent.press(getByText('Skip for now'));

    await act(async () => {
      fireEvent.press(getByText('Submit defer'));
    });

    expect(mockDefer).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          action: 'skip',
          skip_reason_code: 'too_busy',
        }),
      }),
      expect.anything()
    );
  });

  it('renders recovery guidance when intelligence is in recovery mode', () => {
    (useRoutineAssignments as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          routine_id: 10,
          routine_name: 'Morning Routine',
          status: 'active',
          routine_description: 'Daily skin care',
          recovery: {
            state: 'recovery_due',
            headline: 'Recovery mode: restart gently',
            detail: 'Start with the first core step when you return.',
            recommended_action: 'resume',
            provider_follow_up: true,
            follow_up_reason: 'routine_skipped_current_window',
          },
        },
      ],
      isLoading: false,
    });
    (useRoutineIntelligence as jest.Mock).mockReturnValue({
      data: {
        patient_id: 'patient-1',
        focus: {
          kind: 'current',
          routine_id: 10,
          assignment_id: 1,
          routine_name: 'Morning Routine',
          estimated_duration_minutes: 4,
          estimated_duration_basis: 'Estimated from 2 authored steps.',
        },
        adherence: {
          adherence_rate_7d: 0.42,
          logged_events_7d: 4,
          deferred_or_skipped_7d: 2,
          current_streak: 1,
          longest_streak: 7,
          streak_routine_id: 10,
          streak_routine_name: 'Morning Routine',
        },
        recovery: {
          state: 'recovery_due',
          headline: 'Recovery mode: restart gently',
          detail: 'Start with the first core step when you return.',
          recommended_action: 'resume',
          provider_follow_up: true,
          follow_up_reason: 'routine_skipped_current_window',
        },
        generated_at: '2026-03-13T10:00:00Z',
      },
    });

    const { getByTestId, getByText, getAllByText } = render(<RoutinesScreen />, { wrapper });

    expect(getByTestId('routine-recovery-card')).toBeTruthy();
    expect(getByText('Recovery guidance')).toBeTruthy();
    expect(getAllByText('Recovery mode: restart gently').length).toBeGreaterThan(0);
    expect(getAllByText('Your care team may review this recovery signal.').length).toBeGreaterThan(0);
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

  it('uses the success haptic after routine completion instead of warning', async () => {
    const mockMutate = jest.fn((_variables, callbacks) => callbacks?.onSuccess?.({ mode: 'synced' }));
    (useCompleteAssignment as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      syncStatus: undefined,
      syncError: null,
      retrySync: jest.fn(),
    });

    const { getByText } = render(<RoutinesScreen />, { wrapper });

    await act(async () => {
      fireEvent.press(getByText('Complete'));
    });

    expect(hapticService.triggerWarning).not.toHaveBeenCalled();
    expect(hapticService.triggerSuccess).toHaveBeenCalled();
  });
});
