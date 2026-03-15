import { validateDeepLink } from "../src/utils/deepLinkValidator";
import { APP_ROUTES } from "../src/testSupport/deepLinkRoutes";

describe("FIX-020: Mobile Route Alignment", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

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
