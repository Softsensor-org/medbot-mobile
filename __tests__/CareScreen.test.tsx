import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import CareScreen from '../app/(auth)/(tabs)/care';
import { useCreateSession, useSessions } from '../src/hooks/useSessions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../src/hooks/useSessions', () => ({
  useSessions: jest.fn(),
  useCreateSession: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

/**
 * IMP-170: Test fixtures aligned to backend contract (IMP-161).
 *
 * Backend session list returns bare SessionMeta[] with status enum:
 * new/waiting/assigned/closed (not active/resolved/escalated).
 * triage_label is NOT in SessionMeta (stripped by Pydantic).
 */
const NOW = new Date().toISOString();

describe('CareScreen', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useCreateSession as jest.Mock).mockReturnValue({
      mutateAsync,
      isPending: false,
    });
  });

  it('renders loading state correctly', () => {
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: true,
      data: null,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<CareScreen />, { wrapper });
  });

  it('renders empty state when no sessions found', () => {
    // IMP-170: bare array, not { sessions: [], count: 0 }
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [],
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = render(<CareScreen />, { wrapper });

    expect(getByText('No sessions yet')).toBeTruthy();
    expect(getByText('Start New Session')).toBeTruthy();
    expect(getByText('Scan Product Label')).toBeTruthy();
  });

  it('renders session list with backend-aligned status values', () => {
    // IMP-170: status uses backend enum (new/waiting/assigned/closed)
    const mockSessions = [
      {
        session_id: 'session-1',
        status: 'waiting',
        created_at: NOW,
        updated_at: NOW,
        last_message_at: NOW,
        priority_score: 80,
      },
      {
        session_id: 'session-2',
        status: 'closed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        last_message_at: new Date(Date.now() - 86400000).toISOString(),
        priority_score: 20,
      },
    ];

    // IMP-170: bare array
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockSessions,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getAllByText, getByText } = render(<CareScreen />, { wrapper });

    expect(getAllByText(/waiting/i).length).toBeGreaterThan(0);
    expect(getAllByText(/closed/i).length).toBeGreaterThan(0);
    expect(getByText('session-1', { exact: false })).toBeTruthy();
    expect(getByText('session-2', { exact: false })).toBeTruthy();
  });

  it('navigates to chat when a session card is pressed', () => {
    const mockSessions = [
      {
        session_id: 'session-123',
        status: 'new',
        created_at: NOW,
        updated_at: NOW,
        last_message_at: NOW,
        priority_score: 80,
      },
    ];

    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockSessions,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = render(<CareScreen />, { wrapper });

    fireEvent.press(getByText('Resume consultation'));

    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/chat/session-123');
  });

  it('navigates to label scan from the care tab entry card', () => {
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [],
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByTestId } = render(<CareScreen />, { wrapper });

    fireEvent.press(getByTestId('label-scan-button'));

    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/label-scan');
  });

  it('reuses a reusable session (new/waiting) on start', async () => {
    // IMP-170: reusable status is now new/waiting (not active/escalated)
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [
        {
          session_id: 'session-open',
          status: 'waiting',
          created_at: NOW,
          updated_at: NOW,
          last_message_at: NOW,
          priority_score: 60,
        },
      ],
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByTestId } = render(<CareScreen />, { wrapper });

    fireEvent.press(getByTestId('start-session-button'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(auth)/intake',
        params: { sessionId: 'session-open' },
      });
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('creates a new session when none can be reused', async () => {
    mutateAsync.mockResolvedValue({ sessionId: 'session-new' });
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [],
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = render(<CareScreen />, { wrapper });

    fireEvent.press(getByText('Start New Session'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(auth)/intake',
        params: { sessionId: 'session-new' },
      });
    });
  });

  it('shows retry state when bootstrap fails', async () => {
    mutateAsync.mockRejectedValue(new Error('network'));
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [],
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = render(<CareScreen />, { wrapper });

    fireEvent.press(getByText('Start New Session'));

    await waitFor(() => {
      expect(getByText('Unable to start a session right now. Please retry.')).toBeTruthy();
      expect(getByText('Retry start')).toBeTruthy();
    });
  });

  it('does not reuse closed/assigned sessions', async () => {
    mutateAsync.mockResolvedValue({ sessionId: 'session-fresh' });
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: [
        {
          session_id: 'session-done',
          status: 'closed',
          created_at: NOW,
          updated_at: NOW,
          last_message_at: NOW,
        },
      ],
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByTestId } = render(<CareScreen />, { wrapper });

    fireEvent.press(getByTestId('start-session-button'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});
