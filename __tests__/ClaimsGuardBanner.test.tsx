import React from "react";
import { render } from "@testing-library/react-native";
import { ClaimsGuardBanner } from "../src/components/ClaimsGuardBanner";

describe("ClaimsGuardBanner", () => {
  it("renders low_confidence banner", () => {
    const { getByText } = render(
      <ClaimsGuardBanner
        reason="low_confidence"
        message="Not enough data to project."
      />,
    );
    expect(getByText("More data needed")).toBeTruthy();
    expect(getByText("Not enough data to project.")).toBeTruthy();
  });

  it("renders escalation_active banner", () => {
    const { getByText } = render(
      <ClaimsGuardBanner
        reason="escalation_active"
        message="Please see a provider."
      />,
    );
    expect(getByText("Clinical review in progress")).toBeTruthy();
    expect(getByText("Please see a provider.")).toBeTruthy();
  });

  it("renders red_flags_present banner", () => {
    const { getByText } = render(
      <ClaimsGuardBanner
        reason="red_flags_present"
        message="Professional review needed."
      />,
    );
    expect(getByText("Professional review recommended")).toBeTruthy();
    expect(getByText("Professional review needed.")).toBeTruthy();
  });

  it("has alert accessibility role", () => {
    const { UNSAFE_getByProps } = render(
      <ClaimsGuardBanner
        reason="low_confidence"
        message="Test message."
      />,
    );
    // Verify the container View has accessibilityRole="alert"
    const alertView = UNSAFE_getByProps({ accessibilityRole: "alert" });
    expect(alertView).toBeTruthy();
  });
});
