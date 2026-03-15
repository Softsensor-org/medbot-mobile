import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import RecoveryFollowUpCard from "../src/components/RecoveryFollowUpCard";

jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images" },
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

const recovery = {
  status: "check_in_due" as const,
  symptoms: [
    { symptom: "redness" as const, severity: 0 },
    { symptom: "swelling" as const, severity: 0 },
    { symptom: "pain" as const, severity: 0 },
    { symptom: "drainage" as const, severity: 0 },
    { symptom: "itching" as const, severity: 0 },
  ],
  notes: "",
  photos: [],
  guidance: {
    band: "expected" as const,
    headline: "Share how recovery is going",
    detail: "Use this check-in to note healing changes after treatment.",
    next_step: "Update again if anything worsens.",
    watch_for: ["spreading redness", "increasing swelling"],
    escalation_recommended: false,
    provider_follow_up: false,
  },
};

describe("RecoveryFollowUpCard", () => {
  it("submits structured recovery symptoms", () => {
    const onSubmit = jest.fn();
    const { getAllByText, getByText, getByPlaceholderText } = render(
      <RecoveryFollowUpCard
        recovery={recovery}
        journeyStageLabel="recovery"
        treatmentPlanName="Laser Recovery"
        onSubmit={onSubmit}
      />
    );

    fireEvent.press(getAllByText("Mild")[0]);
    fireEvent.changeText(getByPlaceholderText("Add any recovery notes for your care team"), "Pink but comfortable.");
    fireEvent.press(getByText("Save recovery update"));

    expect(onSubmit).toHaveBeenCalledWith({
      symptoms: [
        { symptom: "redness", severity: 1 },
        { symptom: "swelling", severity: 0 },
        { symptom: "pain", severity: 0 },
        { symptom: "drainage", severity: 0 },
        { symptom: "itching", severity: 0 },
      ],
      notes: "Pink but comfortable.",
      photos: [],
      mark_resolved: false,
    });
  });
});
