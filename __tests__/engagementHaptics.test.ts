import { triggerEngagementHaptic } from "../src/engagement/haptics";
import { updateEngagementSettings, __resetEngagementSettingsForTests } from "../src/engagement/engagementSettings";
import * as ExpoHaptics from "expo-haptics";

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: "Success",
    Warning: "Warning",
  },
  ImpactFeedbackStyle: {
    Medium: "Medium",
  },
}));

describe("engagement haptics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetEngagementSettingsForTests();
    updateEngagementSettings({ hapticsEnabled: true });
  });

  it("triggers routine completion feedback when enabled", async () => {
    const ok = await triggerEngagementHaptic("routine_complete");
    expect(ok).toBe(true);
    expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith("Success");
  });

  it("triggers warning feedback for safety acknowledgment", async () => {
    const ok = await triggerEngagementHaptic("warning_acknowledged");
    expect(ok).toBe(true);
    expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith("Warning");
  });

  it("does not trigger haptics when disabled", async () => {
    updateEngagementSettings({ hapticsEnabled: false });
    const ok = await triggerEngagementHaptic("milestone_achieved");
    expect(ok).toBe(false);
    expect(ExpoHaptics.impactAsync).not.toHaveBeenCalled();
    expect(ExpoHaptics.notificationAsync).not.toHaveBeenCalled();
  });
});
