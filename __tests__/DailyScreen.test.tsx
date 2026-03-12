import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import DailyScreen from "../app/(auth)/(tabs)/index";

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../src/components/HeroDashboard", () => ({
  HeroDashboard: () => {
    const { Text } = require("react-native");
    return <Text>HeroDashboard</Text>;
  },
}));

jest.mock("../src/components/TodayPlan", () => ({
  TodayPlan: () => {
    const { Text } = require("react-native");
    return <Text>TodayPlan</Text>;
  },
}));

jest.mock("../src/components/AutopilotCard", () => ({
  AutopilotCard: () => {
    const { Text } = require("react-native");
    return <Text>AutopilotCard</Text>;
  },
}));

describe("DailyScreen", () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it("renders the connected daily plan modules", () => {
    const { getByText } = render(<DailyScreen />);

    expect(getByText("Daily Plan")).toBeTruthy();
    expect(getByText("HeroDashboard")).toBeTruthy();
    expect(getByText("TodayPlan")).toBeTruthy();
    expect(getByText("AutopilotCard")).toBeTruthy();
  });

  it("opens progress when the stats button is pressed", () => {
    const { getByTestId } = render(<DailyScreen />);

    fireEvent.press(getByTestId("daily-progress-button"));

    expect(push).toHaveBeenCalledWith("/(auth)/(tabs)/progress");
  });
});
