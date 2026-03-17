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

function makeCard(
  overrides: Partial<ChatCard> & {
    card_type: ChatCard["card_type"];
    data: Record<string, unknown>;
  }
): ChatCard {
  return {
    card_id: "test-card-1",
    status: "draft",
    confidence: 0.9,
    source_turn: 1,
    editable_fields: [],
    ...overrides,
  };
}

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

  it("renders symptom card with human-readable fields", () => {
    const card = makeCard({
      card_type: "symptom",
      data: { name: "Itchy rash", body_location: "Left arm", severity: "Moderate", duration: "3 days" },
    });
    const { getByText, queryByText } = render(<ChatCardInline card={card} />);
    expect(getByText("Symptom")).toBeTruthy();
    expect(getByText("Itchy rash")).toBeTruthy();
    expect(getByText("Left arm")).toBeTruthy();
    expect(getByText(/Severity.*Moderate/)).toBeTruthy();
    expect(getByText(/Duration.*3 days/)).toBeTruthy();
    expect(queryByText(/"name"/)).toBeNull();
    expect(queryByText(/\{.*"body_location"/)).toBeNull();
  });

  it("renders product card with human-readable fields", () => {
    const card = makeCard({
      card_type: "product",
      data: { name: "Hydrocortisone Cream", usage: "Apply twice daily", query_type: "recommendation" },
    });
    const { getByText, queryByText } = render(<ChatCardInline card={card} />);
    expect(getByText("Product")).toBeTruthy();
    expect(getByText("Hydrocortisone Cream")).toBeTruthy();
    expect(getByText("Apply twice daily")).toBeTruthy();
    expect(getByText("Recommendation")).toBeTruthy();
    expect(queryByText(/"name"/)).toBeNull();
  });

  it("renders routine card with keywords and suggested action", () => {
    const card = makeCard({
      card_type: "routine",
      data: {
        routine_type: "morning_care",
        keywords: ["moisturizer", "sunscreen"],
        frequency: "Daily",
        suggested_action: "create",
      },
    });
    const { getByText, queryByText } = render(<ChatCardInline card={card} />);
    expect(getByText("Routine")).toBeTruthy();
    expect(getByText("Morning Care")).toBeTruthy();
    expect(getByText("Daily")).toBeTruthy();
    expect(getByText("moisturizer")).toBeTruthy();
    expect(getByText("sunscreen")).toBeTruthy();
    expect(getByText(/Suggested.*Create/)).toBeTruthy();
    expect(queryByText(/"routine_type"/)).toBeNull();
  });

  it("renders intervention card with related symptoms", () => {
    const card = makeCard({
      card_type: "intervention",
      data: {
        intervention_type: "topical_treatment",
        description: "Start with mild steroid cream",
        related_symptoms: ["eczema", "dryness"],
      },
    });
    const { getByText, queryByText } = render(<ChatCardInline card={card} />);
    expect(getByText("Intervention")).toBeTruthy();
    expect(getByText("Topical Treatment")).toBeTruthy();
    expect(getByText("Start with mild steroid cream")).toBeTruthy();
    expect(getByText("eczema")).toBeTruthy();
    expect(getByText("dryness")).toBeTruthy();
    expect(queryByText(/"intervention_type"/)).toBeNull();
  });

  it("does not show JSON.stringify for known structured card types", () => {
    const types = ["symptom", "product", "routine", "intervention"] as const;
    for (const cardType of types) {
      const card = makeCard({
        card_type: cardType,
        data: { name: "test", detail: "value" },
      });
      const { queryByText } = render(<ChatCardInline card={card} />);
      expect(queryByText(/\{"name"/)).toBeNull();
    }
  });
});
