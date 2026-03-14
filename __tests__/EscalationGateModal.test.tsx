import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import EscalationGateModal from "../src/components/EscalationGateModal";

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

describe("EscalationGateModal", () => {
  const onAcknowledge = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDialerSupport = (supported: boolean) =>
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(supported);

  const mockOpenDialer = () =>
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);

  it("renders when visible", () => {
    const { getByText } = render(
      <EscalationGateModal
        visible={true}
        category="general_emergency"
        guidance="Please call 911 immediately."
        onAcknowledge={onAcknowledge}
      />
    );

    expect(getByText("Seek Emergency Care")).toBeTruthy();
    expect(getByText("Please call 911 immediately.")).toBeTruthy();
    expect(getByText("Call 911")).toBeTruthy();
    expect(getByText("I understand — continue")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(
      <EscalationGateModal
        visible={false}
        category="general_emergency"
        guidance="Please call 911."
        onAcknowledge={onAcknowledge}
      />
    );

    expect(queryByText("Seek Emergency Care")).toBeNull();
  });

  it("calls onAcknowledge when acknowledge button pressed", () => {
    const { getByTestId } = render(
      <EscalationGateModal
        visible={true}
        category="general_emergency"
        guidance="Call 911."
        onAcknowledge={onAcknowledge}
      />
    );

    fireEvent.press(getByTestId("escalation-acknowledge-button"));
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  it("shows mental health crisis config", () => {
    const { getByText } = render(
      <EscalationGateModal
        visible={true}
        category="mental_health_crisis"
        guidance="Contact the 988 Lifeline."
        onAcknowledge={onAcknowledge}
      />
    );

    expect(getByText("Crisis Support Available")).toBeTruthy();
    expect(getByText("Call 988")).toBeTruthy();
  });

  it("shows derm emergency config", () => {
    const { getByText } = render(
      <EscalationGateModal
        visible={true}
        category="life_threatening_derm"
        guidance="Go to the ER immediately."
        onAcknowledge={onAcknowledge}
      />
    );

    expect(getByText("Urgent Medical Attention Needed")).toBeTruthy();
  });

  it("shows clinical review config for red flag escalation", () => {
    const { getByText } = render(
      <EscalationGateModal
        visible={true}
        category="red_flag_escalation"
        guidance="Please follow up with your doctor."
        onAcknowledge={onAcknowledge}
      />
    );

    expect(getByText("Clinical Review Required")).toBeTruthy();
    expect(getByText("Call your doctor")).toBeTruthy();
  });

  it("maps emergency categories to the expected dial target", async () => {
    const canOpenURL = mockDialerSupport(true);
    const openURL = mockOpenDialer();
    const { getByTestId, rerender } = render(
      <EscalationGateModal
        visible={true}
        category="general_emergency"
        guidance="Please call 911 immediately."
        onAcknowledge={onAcknowledge}
      />
    );

    fireEvent.press(getByTestId("escalation-call-button"));

    await waitFor(() => {
      expect(canOpenURL).toHaveBeenCalledWith("tel:911");
      expect(openURL).toHaveBeenCalledWith("tel:911");
    });

    rerender(
      <EscalationGateModal
        visible={true}
        category="mental_health_crisis"
        guidance="Contact the 988 Lifeline."
        onAcknowledge={onAcknowledge}
      />
    );

    fireEvent.press(getByTestId("escalation-call-button"));

    await waitFor(() => {
      expect(canOpenURL).toHaveBeenCalledWith("tel:988");
      expect(openURL).toHaveBeenCalledWith("tel:988");
    });
  });

  it("does not dial 911 for red flag escalation and shows a manual fallback", async () => {
    const canOpenURL = mockDialerSupport(true);
    const openURL = mockOpenDialer();
    const { getByTestId, getByText } = render(
      <EscalationGateModal
        visible={true}
        category="red_flag_escalation"
        guidance="Please follow up with your doctor."
        onAcknowledge={onAcknowledge}
      />
    );

    fireEvent.press(getByTestId("escalation-call-button"));

    await waitFor(() => {
      expect(
        getByText(
          "Please call your doctor using the clinic or care-team number you already have on file."
        )
      ).toBeTruthy();
    });
    expect(canOpenURL).not.toHaveBeenCalled();
    expect(openURL).not.toHaveBeenCalled();
  });

  it("shows a user-visible fallback when the dialer is unsupported", async () => {
    const canOpenURL = mockDialerSupport(false);
    const openURL = mockOpenDialer();
    const { getByTestId, getByText } = render(
      <EscalationGateModal
        visible={true}
        category="general_emergency"
        guidance="Please call 911 immediately."
        onAcknowledge={onAcknowledge}
      />
    );

    fireEvent.press(getByTestId("escalation-call-button"));

    await waitFor(() => {
      expect(canOpenURL).toHaveBeenCalledWith("tel:911");
      expect(
        getByText("Unable to open your phone app. Please dial 911 manually.")
      ).toBeTruthy();
    });
    expect(openURL).not.toHaveBeenCalled();
  });

  it("uses default config for unknown category", () => {
    const { getByText } = render(
      <EscalationGateModal
        visible={true}
        category={null}
        guidance={null}
        onAcknowledge={onAcknowledge}
      />
    );

    expect(getByText("Important Health Notice")).toBeTruthy();
    // Should show default guidance
    expect(
      getByText(/we recommend seeking immediate medical attention/i)
    ).toBeTruthy();
  });
});
