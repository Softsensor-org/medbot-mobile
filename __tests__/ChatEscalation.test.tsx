import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ChatScreen from "../app/(auth)/chat/[sessionId]";
import {
  useSessionTranscript,
  useEvidenceSnapshot,
} from "../src/hooks/useSessions";
import { streamChat } from "../src/stream/streamChat";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("../src/hooks/useSessions", () => ({
  useSessionTranscript: jest.fn(),
  useEvidenceSnapshot: jest.fn(),
}));

jest.mock("../src/stream/streamChat", () => ({
  streamChat: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("ChatScreen escalation gate", () => {
  const mockRouter = { back: jest.fn(), push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      sessionId: "esc-test-1",
    });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSessionTranscript as jest.Mock).mockReturnValue({
      data: { transcript: [] },
      isLoading: false,
    });
    (useEvidenceSnapshot as jest.Mock).mockReturnValue({ data: null });
  });

  it("shows escalation modal when stream complete has escalation_required", async () => {
    (streamChat as jest.Mock).mockImplementation((options) => {
      const { onEvent } = options;
      onEvent({ type: "token", content: "Emergency detected." });
      onEvent({
        type: "complete",
        model_output: {
          triage_label: "urgent",
          summary_for_patient: "Call 911 immediately.",
          escalation_required: true,
          escalation_category: "general_emergency",
          escalation_guidance: "Please call emergency services right away.",
        },
      });
      return jest.fn();
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <ChatScreen />,
      { wrapper }
    );

    fireEvent.changeText(
      getByPlaceholderText("Type a message..."),
      "chest pain"
    );

    await act(async () => {
      fireEvent.press(getByTestId("send-button"));
    });

    // Escalation modal should be visible
    expect(getByText("Seek Emergency Care")).toBeTruthy();
    expect(
      getByText("Please call emergency services right away.")
    ).toBeTruthy();
  });

  it("does not show escalation modal for routine responses", async () => {
    (streamChat as jest.Mock).mockImplementation((options) => {
      const { onEvent } = options;
      onEvent({ type: "token", content: "Your skin looks fine." });
      onEvent({
        type: "complete",
        model_output: {
          triage_label: "self_care",
          summary_for_patient: "Your skin looks fine.",
        },
      });
      return jest.fn();
    });

    const { getByPlaceholderText, getByTestId, queryByText } = render(
      <ChatScreen />,
      { wrapper }
    );

    fireEvent.changeText(
      getByPlaceholderText("Type a message..."),
      "mild rash"
    );

    await act(async () => {
      fireEvent.press(getByTestId("send-button"));
    });

    // No escalation modal
    expect(queryByText("Seek Emergency Care")).toBeNull();
    expect(queryByText("Urgent Medical Attention Needed")).toBeNull();
  });

  it("dismisses escalation modal on acknowledge", async () => {
    (streamChat as jest.Mock).mockImplementation((options) => {
      const { onEvent } = options;
      onEvent({
        type: "complete",
        model_output: {
          triage_label: "urgent",
          summary_for_patient: "Seek care.",
          escalation_required: true,
          escalation_category: "general_emergency",
          escalation_guidance: "Call 911.",
        },
      });
      return jest.fn();
    });

    const { getByPlaceholderText, getByTestId, queryByText } = render(
      <ChatScreen />,
      { wrapper }
    );

    fireEvent.changeText(
      getByPlaceholderText("Type a message..."),
      "emergency"
    );

    await act(async () => {
      fireEvent.press(getByTestId("send-button"));
    });

    // Modal is visible
    expect(getByTestId("escalation-acknowledge-button")).toBeTruthy();

    // Dismiss
    await act(async () => {
      fireEvent.press(getByTestId("escalation-acknowledge-button"));
    });

    // Modal should be gone
    expect(queryByText("Seek Emergency Care")).toBeNull();
  });
});
