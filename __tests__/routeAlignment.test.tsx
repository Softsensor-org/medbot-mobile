import { validateDeepLink } from "../src/utils/deepLinkValidator";

describe("FIX-020: Mobile Route Alignment", () => {
  it("accepts current grouped auth routes used by the app shell", () => {
    expect(validateDeepLink("/(auth)/(tabs)")).toBe("/(auth)/(tabs)");
    expect(validateDeepLink("/(auth)/(tabs)/routines")).toBe("/(auth)/(tabs)/routines");
    expect(validateDeepLink("/(auth)/(tabs)/progress")).toBe("/(auth)/(tabs)/progress");
    expect(validateDeepLink("/(auth)/timeline")).toBe("/(auth)/timeline");
    expect(validateDeepLink("/(auth)/settings")).toBe("/(auth)/settings");
    expect(validateDeepLink("/(auth)/notifications")).toBe("/(auth)/notifications");
    expect(validateDeepLink("/(auth)/consent")).toBe("/(auth)/consent");
    expect(validateDeepLink("/(auth)/onboarding/skin-brief")).toBe("/(auth)/onboarding/skin-brief");
    expect(validateDeepLink("/(auth)/onboarding/preferences")).toBe("/(auth)/onboarding/preferences");
    expect(validateDeepLink("/(auth)/interventions")).toBe("/(auth)/interventions");
  });

  it("normalizes grouped auth route variants with trailing slashes", () => {
    expect(validateDeepLink("/(auth)/(tabs)/")).toBe("/(auth)/(tabs)");
    expect(validateDeepLink("/(auth)/(tabs)/progress/")).toBe("/(auth)/(tabs)/progress");
    expect(validateDeepLink("medbot:///(auth)/(tabs)/routines/")).toBe("/(auth)/(tabs)/routines");
  });

  it("keeps blocked routes on the safe fallback even when slash variants are used", () => {
    expect(validateDeepLink("/admin/danger/")).toBe("/(auth)/(tabs)");
    expect(validateDeepLink("medbot://https://evil.example/")).toBe("/(auth)/(tabs)");
  });
});
