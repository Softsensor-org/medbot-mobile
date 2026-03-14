import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DailyScreen from "../app/(auth)/(tabs)/index";
import { useRouter } from "expo-router";

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

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("DailyScreen", () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("renders the premium daily shell copy", () => {
    const { getByText } = render(<DailyScreen />, { wrapper });

    expect(getByText("Daily Plan")).toBeTruthy();
    expect(getByText("How you're doing, what comes next, and what to watch today.")).toBeTruthy();
    expect(getByText("HeroDashboard")).toBeTruthy();
    expect(getByText("TodayPlan")).toBeTruthy();
    expect(getByText("AutopilotCard")).toBeTruthy();
    expect(
      getByText(
        "One photo, one completed step, and one quick symptom note give tomorrow's plan better context.",
      ),
    ).toBeTruthy();
  });

  it("navigates to progress from the header shortcut", () => {
    const { getByTestId } = render(<DailyScreen />, { wrapper });

    fireEvent.press(getByTestId("daily-progress-button"));

    expect(mockRouter.push).toHaveBeenCalledWith("/(auth)/(tabs)/progress");
  });
});
