import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReviewPacketScreen from '../../app/(auth)/intake/review';
import { useConsentStatus, useConsentTypes, useRecordConsent } from '../../src/hooks/useConsent';
import { useSharePacket, useEvidenceSnapshot } from '../../src/hooks/useSessions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ sessionId: 'test-session-123' }),
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
