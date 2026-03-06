import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ChatScreen from '../app/(auth)/chat/[sessionId]';
import { useSessionTranscript, useEvidenceSnapshot } from '../src/hooks/useSessions';
import { streamChat } from '../src/stream/streamChat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocks
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('../src/hooks/useSessions', () => ({
  useSessionTranscript: jest.fn(),
  useEvidenceSnapshot: jest.fn(),
}));

jest.mock('../src/stream/streamChat', () => ({
  streamChat: jest.fn(),
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

describe('ChatScreen', () => {
  const mockRouter = { back: jest.fn(), push: jest.fn() };
  const mockSessionId = 'test-session-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ sessionId: mockSessionId });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders transcript messages correctly', async () => {
    (useSessionTranscript as jest.Mock).mockReturnValue({
      data: {
        transcript: [
          { role: 'user', content: 'Hello doctor', timestamp: '2026-03-05T10:00:00Z' },
          { role: 'assistant', content: 'How can I help?', timestamp: '2026-03-05T10:00:05Z' },
        ],
      },
      isLoading: false,
    });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({ data: null });

    const { getByText } = render(<ChatScreen />, { wrapper });

    expect(getByText('Hello doctor')).toBeTruthy();
    expect(getByText('How can I help?')).toBeTruthy();
  });

  it('shows evidence progress when snapshot is available', () => {
    (useSessionTranscript as jest.Mock).mockReturnValue({ data: { transcript: [] }, isLoading: false });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({
      data: {
        slots: [{ name: 'location', state: 'provided', value: 'arm' }],
        evidence_completeness: 0.5,
        missing_evidence: ['duration'],
      },
    });

    const { getByText } = render(<ChatScreen />, { wrapper });

    expect(getByText('50%')).toBeTruthy();
    expect(getByText(/Still needed: duration/i)).toBeTruthy();
  });

  it('handles message sending and streaming', async () => {
    (useSessionTranscript as jest.Mock).mockReturnValue({ data: { transcript: [] }, isLoading: false });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({ data: null });
    
    // Mock streamChat to simulate token events
    (streamChat as jest.Mock).mockImplementation((options) => {
      const { onEvent } = options;
      // Trigger events synchronously for easier testing
      onEvent({ type: 'token', content: 'Sure, ' });
      onEvent({ type: 'token', content: 'tell me more.' });
      return jest.fn(); // cleanup
    });

    const { getByPlaceholderText, getByTestId } = render(<ChatScreen />, { wrapper });

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'I have a rash');
    
    const sendButton = getByTestId('send-button');
    
    await act(async () => {
      fireEvent.press(sendButton);
    });

    expect(streamChat).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: mockSessionId,
      message: 'I have a rash',
    }));

    expect(getByTestId('streamed-content')).toBeTruthy();
    expect(getByTestId('streamed-content').children[0]).toBe('Sure, tell me more.');
  });

  it('handles invalid session id', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ sessionId: null });
    
    const { getByText } = render(<ChatScreen />, { wrapper });
    
    expect(getByText(/Invalid session ID/i)).toBeTruthy();
  });
});
