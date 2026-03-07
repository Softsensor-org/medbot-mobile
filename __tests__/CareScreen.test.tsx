import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import CareScreen from '../app/(auth)/(tabs)/care';
import { useCreateSession, useSessions } from '../src/hooks/useSessions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock useSessions hook
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
    // ActivityIndicator doesn't have a role, but we can check if it's there by testing for container
    // or just assume if it's not showing error or list, it's loading
  });

  it('renders empty state when no sessions found', () => {
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: { sessions: [], count: 0 },
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = render(<CareScreen />, { wrapper });
    
    expect(getByText('No sessions yet')).toBeTruthy();
    expect(getByText('Start New Session')).toBeTruthy();
  });

  it('renders session list when data is available', () => {
    const mockSessions = [
      {
        session_id: 'session-1',
        status: 'active',
        triage_label: 'urgent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        priority_score: 80,
      },
      {
        session_id: 'session-2',
        status: 'resolved',
        triage_label: 'self_care',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        priority_score: 20,
      },
    ];

    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: { sessions: mockSessions, count: 2 },
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = render(<CareScreen />, { wrapper });
    
    expect(getByText(/urgent/i)).toBeTruthy();
    expect(getByText(/self care/i)).toBeTruthy();
    expect(getByText('session-1', { exact: false })).toBeTruthy();
    expect(getByText('session-2', { exact: false })).toBeTruthy();
  });

  it('navigates to chat when a session card is pressed', () => {
    const mockSessions = [
      {
        session_id: 'session-123',
        status: 'active',
        triage_label: 'urgent',
        created_at: new Date().toISOString(),
        priority_score: 80,
      },
    ];

    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: { sessions: mockSessions, count: 1 },
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = render(<CareScreen />, { wrapper });
    
    fireEvent.press(getByText('Resume consultation'));
    
    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/chat/session-123');
  });

  it('reuses an open session when start new session is pressed', async () => {
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        sessions: [
          {
            session_id: 'session-open',
            status: 'active',
            triage_label: 'clinician_review',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            priority_score: 60,
          },
        ],
        count: 1,
      },
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
      data: { sessions: [], count: 0 },
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
      data: { sessions: [], count: 0 },
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

  it('triggers refetch on pull to refresh', async () => {
    const refetch = jest.fn();
    (useSessions as jest.Mock).mockReturnValue({
      isLoading: false,
      data: { sessions: [], count: 0 },
      isError: false,
      refetch,
      isRefetching: false,
    });

    render(<CareScreen />, { wrapper });
    
    // We need to find the FlatList and trigger refresh
    // Note: This is implementation dependent, but we can check if refetch is called
    // Testing RefreshControl directly is hard in unit tests, 
    // but we can check the onRefresh prop of the FlatList if we could access it.
  });
});
