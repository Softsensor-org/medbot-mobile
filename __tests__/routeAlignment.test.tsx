import { validateDeepLink } from "../src/utils/deepLinkValidator";

describe("FIX-020: Mobile Route Alignment", () => {
  const APP_ROUTES = [
    "/(auth)/(tabs)",
    "/(auth)/(tabs)/care",
    "/(auth)/(tabs)/routines",
    "/(auth)/(tabs)/progress",
    "/(auth)/(tabs)/profile",
    "/(auth)/intake",
    "/(auth)/intake/camera",
    "/(auth)/intake/symptom-log",
    "/(auth)/intake/pre-visit",
    "/(auth)/intake/review",
    "/(auth)/settings",
    "/(auth)/notifications",
    "/(auth)/consent",
    "/(auth)/label-scan",
    "/(auth)/timeline",
    "/(auth)/interventions",
    "/(auth)/onboarding/skin-brief",
    "/(auth)/onboarding/preferences",
    "/(auth)/onboarding/goal-journey",
    "/weekly-reveal",
  ];

  it.each(APP_ROUTES)("router path %s is in the deep-link allowlist", (route) => {
    expect(validateDeepLink(route)).toBe(route);
  });

  it("trailing-slash variants resolve to the canonical route", () => {
    for (const route of APP_ROUTES) {
      expect(validateDeepLink(`${route}/`)).toBe(route);
    }
  });

  it("keeps blocked routes on the safe fallback even when slash variants are used", () => {
    expect(validateDeepLink("/admin/danger/")).toBe("/(auth)/(tabs)");
    expect(validateDeepLink("medbot://https://evil.example/")).toBe("/(auth)/(tabs)");
  });
});
