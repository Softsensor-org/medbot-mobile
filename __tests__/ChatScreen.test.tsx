import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
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

/**
 * IMP-170: Chat test fixtures aligned to backend contract (IMP-161).
 *
 * Backend transcript endpoint returns bare TranscriptMessage[] array,
 * not { transcript: [...] }.
 */
describe('ChatScreen', () => {
  const mockRouter = { back: jest.fn(), push: jest.fn() };
  const mockSessionId = 'test-session-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ sessionId: mockSessionId });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders transcript messages correctly', async () => {
    // IMP-170: bare array, not { transcript: [...] }
    (useSessionTranscript as jest.Mock).mockReturnValue({
      data: [
        { role: 'user', content: 'Hello doctor' },
        { role: 'assistant', content: 'How can I help?' },
      ],
      isLoading: false,
    });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({ data: null });

    const { getByText } = render(<ChatScreen />, { wrapper });

    expect(getByText('Hello doctor')).toBeTruthy();
    expect(getByText('How can I help?')).toBeTruthy();
  });

  it('shows evidence progress when snapshot is available', () => {
    // IMP-170: bare array
    (useSessionTranscript as jest.Mock).mockReturnValue({ data: [], isLoading: false });
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
    (useSessionTranscript as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({ data: null });

    (streamChat as jest.Mock).mockImplementation((options) => {
      const { onEvent } = options;
      onEvent({ type: 'token', content: 'Sure, ' });
      onEvent({ type: 'token', content: 'tell me more.' });
      return jest.fn();
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
      query: 'I have a rash',
    }));

    expect(getByTestId('streamed-content')).toBeTruthy();
    expect(getByTestId('streamed-content').children[0]).toBe('Sure, tell me more.');
  });

  it('keeps the final assistant reply visible after stream completion', async () => {
    (useSessionTranscript as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({ data: null });

    (streamChat as jest.Mock).mockImplementation(async ({ onEvent }) => {
      onEvent({ type: 'token', content: 'Thanks for the update.' });
      onEvent({ type: 'complete', model_output: { escalation_required: false } });
    });

    const { getByPlaceholderText, getByTestId, getByText, queryByTestId } = render(<ChatScreen />, { wrapper });

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'My skin is itchy');

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    await waitFor(() => {
      expect(getByText('Thanks for the update.')).toBeTruthy();
    });
    expect(queryByTestId('streamed-content')).toBeNull();
  });

  it('handles invalid session id', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ sessionId: null });

    const { getByText } = render(<ChatScreen />, { wrapper });

    expect(getByText(/Invalid session ID/i)).toBeTruthy();
  });

  it('handles empty transcript from backend', () => {
    (useSessionTranscript as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({ data: null });

    // Should not crash on empty bare array
    const { getByPlaceholderText } = render(<ChatScreen />, { wrapper });
    expect(getByPlaceholderText('Type a message...')).toBeTruthy();
  });

  it('preserves the session id when opening intake from chat', () => {
    (useSessionTranscript as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({
      data: {
        slots: [],
        evidence_completeness: 0.4,
        missing_evidence: ['photo'],
      },
    });

    const { getByTestId } = render(<ChatScreen />, { wrapper });

    fireEvent.press(getByTestId('chat-intake-info-button'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/(auth)/intake',
      params: { sessionId: mockSessionId },
    });
  });
});
