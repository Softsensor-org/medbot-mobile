import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { ChatCardInline } from "../src/components/ChatCardInline";
import { sessionsApi } from "../src/api/sessionsApi";
import type { ChatCard } from "../src/types/ai";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

jest.mock("../src/api/sessionsApi", () => ({
  sessionsApi: {
    flagCard: jest.fn(),
  },
}));

const mockedSessionsApi = sessionsApi as jest.Mocked<typeof sessionsApi>;

const SUMMARY_CARD: ChatCard = {
  card_id: "summary-1",
  card_type: "summary",
  status: "draft",
  confidence: 0.95,
  data: {
    topics_discussed: ["rash"],
    data_captured: ["itching"],
    recommended_next_step: "Continue monitoring.",
    turn_count: 3,
  },
  source_turn: 3,
  editable_fields: [],
};

describe("ChatCardInline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deduplicates rapid flag presses while the request is pending", async () => {
    let resolveFlag: ((card: ChatCard) => void) | undefined;
    mockedSessionsApi.flagCard.mockImplementation(
      () =>
        new Promise<ChatCard>((resolve) => {
          resolveFlag = resolve;
        })
    );

    const { getByText } = render(<ChatCardInline card={SUMMARY_CARD} />);
    const flagButton = getByText("Flag for Correction");

    fireEvent.press(flagButton);
    fireEvent.press(flagButton);

    expect(mockedSessionsApi.flagCard).toHaveBeenCalledTimes(1);
    expect(mockedSessionsApi.flagCard).toHaveBeenCalledWith("summary-1");

    await act(async () => {
      resolveFlag?.({ ...SUMMARY_CARD, status: "flagged" });
    });
  });
});
