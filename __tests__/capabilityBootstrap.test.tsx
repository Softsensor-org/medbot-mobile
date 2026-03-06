import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueryProvider } from "../src/providers/QueryProvider";
import { capabilityKeys } from "../src/queryKeys";
import TabsLayout from "../app/(auth)/(tabs)/_layout";
import client from "../src/api/client";
import {
  DEFAULT_CAPABILITIES,
  getCapabilities,
  resetCapabilities,
} from "../src/api/capabilityGuard";

const screenSpy = jest.fn(() => null);
const TabsMock = ({ children }: { children: React.ReactNode }) => <>{children}</>;
Object.assign(TabsMock, { Screen: screenSpy });

jest.mock("expo-router", () => ({
  Tabs: TabsMock,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("../src/api/client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockClient = client as jest.Mocked<typeof client>;

const CAPABILITIES_WITH_ROUTINES_DISABLED = {
  modules: {
    ...DEFAULT_CAPABILITIES.modules,
    routines: false,
  },
};

describe("capability bootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCapabilities();
  });

  it("prefetches capabilities when QueryProvider mounts", async () => {
    const prefetchSpy = jest
      .spyOn(QueryClient.prototype, "prefetchQuery")
      .mockResolvedValue(undefined);

    const { unmount } = render(
      <QueryProvider>
        <React.Fragment />
      </QueryProvider>
    );

    await waitFor(() => {
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: capabilityKeys.all })
      );
    });

    unmount();
    prefetchSpy.mockRestore();
  });

  it("hides routines tab when capabilities are loaded and routines is disabled", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { gcTime: Infinity },
      },
    });
    queryClient.setQueryData(capabilityKeys.all, CAPABILITIES_WITH_ROUTINES_DISABLED);

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <TabsLayout />
      </QueryClientProvider>
    );

    const screenCalls = screenSpy.mock.calls as unknown as Array<
      [{ name: string; options?: { href?: string | null } }]
    >;

    const routinesCall = screenCalls.find(([props]) => props.name === "routines");
    expect(routinesCall?.[0].options?.href).toBeNull();

    const careCall = screenCalls.find(([props]) => props.name === "care");
    expect(careCall?.[0].options?.href).toBeUndefined();

    unmount();
    queryClient.clear();
  });

  it("returns safe default capabilities when endpoint fails", async () => {
    mockClient.get.mockRejectedValueOnce(new Error("network down"));

    const capabilities = await getCapabilities();

    expect(capabilities).toEqual(DEFAULT_CAPABILITIES);
  });
});
