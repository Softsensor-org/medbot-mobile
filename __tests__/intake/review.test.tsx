import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReviewPacketScreen from '../../app/(auth)/intake/review';
import { useConsentStatus, useConsentTypes, useRecordConsent } from '../../src/hooks/useConsent';
import { useSharePacket, useEvidenceSnapshot } from '../../src/hooks/useSessions';
import { useSetIntakeMode } from '../../src/hooks/useWellness';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
};

// Mocks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => mockRouter),
  useLocalSearchParams: jest.fn(() => ({ sessionId: 'test-session-123' })),
}));

jest.mock('../../src/hooks/useConsent', () => ({
  useConsentStatus: jest.fn(),
  useConsentTypes: jest.fn(),
  useRecordConsent: jest.fn(),
}));

jest.mock('../../src/hooks/useSessions', () => ({
  useSharePacket: jest.fn(),
  useEvidenceSnapshot: jest.fn(),
}));

jest.mock('../../src/hooks/useWellness', () => ({
  useSetIntakeMode: jest.fn(),
}));

jest.mock('../../src/providers/ToastProvider', () => ({
  showToast: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
  Ionicons: "Ionicons",
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ReviewPacketScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useConsentStatus as jest.Mock).mockReturnValue({ data: { pending_required: [] }, isLoading: false });
    (useConsentTypes as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useRecordConsent as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    (useSharePacket as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    (useSetIntakeMode as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      syncStatus: 'idle',
      syncError: null,
      retrySync: jest.fn(),
    });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({
      data: {
        slots: [{ name: 'location', state: 'provided', value: 'arm' }],
        evidence_completeness: 0.5,
        red_flags: [],
      },
      isLoading: false,
    });
  });

  it('renders review step correctly', () => {
    const { getByText } = render(<ReviewPacketScreen />, { wrapper });
    
    expect(getByText(/Review Packet/i)).toBeTruthy();
    expect(getByText(/Location:/i)).toBeTruthy();
    expect(getByText(/arm/i)).toBeTruthy();
  });

  it('is intended to be reached from the intake selector with a session id', async () => {
    const { useRouter, useLocalSearchParams } = jest.requireMock('expo-router');
    useRouter.mockReturnValue(mockRouter);
    useLocalSearchParams.mockReturnValue({ sessionId: 'test-session-123' });
    const IntakeModeSelector = require('../../app/(auth)/intake/index').default;

    const { getByTestId } = render(<IntakeModeSelector />, { wrapper });

    fireEvent.press(getByTestId('review-packet-card'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(auth)/intake/review',
        params: { sessionId: 'test-session-123' },
      });
    });
  });

  it('routes directly to intake destinations when no session is present', async () => {
    const { useRouter, useLocalSearchParams } = jest.requireMock('expo-router');
    useRouter.mockReturnValue(mockRouter);
    useLocalSearchParams.mockReturnValue({});
    const IntakeModeSelector = require('../../app/(auth)/intake/index').default;

    const { getByText } = render(<IntakeModeSelector />, { wrapper });

    fireEvent.press(getByText('Log a Symptom'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/intake/symptom-log');
    });
  });

  it('returns to chat from the intake selector when a session is present', async () => {
    const { useRouter, useLocalSearchParams } = jest.requireMock('expo-router');
    useRouter.mockReturnValue(mockRouter);
    useLocalSearchParams.mockReturnValue({ sessionId: 'test-session-123' });
    const IntakeModeSelector = require('../../app/(auth)/intake/index').default;

    const { getByText } = render(<IntakeModeSelector />, { wrapper });

    fireEvent.press(getByText('Return to Chat'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/(auth)/chat/[sessionId]',
        params: { sessionId: 'test-session-123' },
      });
    });
  });

  it('handles direct share when no consents pending', async () => {
    const mockShare = jest.fn().mockResolvedValue({});
    (useSharePacket as jest.Mock).mockReturnValue({ mutateAsync: mockShare, isPending: false });

    const { getByText } = render(<ReviewPacketScreen />, { wrapper });
    
    fireEvent.press(getByText(/Share with Doctor/i));
    
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
    });
  });
});
