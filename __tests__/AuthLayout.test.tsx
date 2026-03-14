import React from "react";
import { render } from "@testing-library/react-native";
import AuthLayout from "../app/(auth)/_layout";
import { useAuth } from "../src/auth/useAuth";
import { useConsentStatus } from "../src/hooks/useConsent";

const mockUsePathname = jest.fn();

jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  const Stack = Object.assign(
    ({ children }: { children?: React.ReactNode }) => (
      <>
        <Text>auth-stack</Text>
        {children}
      </>
    ),
    { Screen: () => null },
  );

  return {
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
    Stack,
    usePathname: () => mockUsePathname(),
  };
});

jest.mock("../src/auth/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../src/hooks/useConsent", () => ({
  useConsentStatus: jest.fn(),
}));

jest.mock("../src/components/common/LoadingSpinner", () => ({
  LoadingSpinner: () => {
    const { Text } = require("react-native");
    return <Text>loading</Text>;
  },
}));

jest.mock("../src/components/common/SyncStatus", () => ({
  SyncStatus: () => null,
}));

jest.mock("../src/components/common/WebHeaderBackground", () => ({
  WebHeaderBackground: () => null,
}));

describe("AuthLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/settings");
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: { requires_action: false },
      isLoading: false,
    });
  });

  it("redirects unauthenticated users to sign in", () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { getByText } = render(<AuthLayout />);

    expect(getByText("redirect:/sign-in")).toBeTruthy();
  });

  it("shows a spinner while consent status loads for gated routes", () => {
    mockUsePathname.mockReturnValue("/chat/session-123");
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { getByText } = render(<AuthLayout />);

    expect(getByText("loading")).toBeTruthy();
  });

  it("redirects gated data-sharing routes to consent when action is required", () => {
    mockUsePathname.mockReturnValue("/chat/session-123");
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: { requires_action: true },
      isLoading: false,
    });

    const { getByText } = render(<AuthLayout />);

    expect(getByText("redirect:/(auth)/consent")).toBeTruthy();
  });

  it("does not block non-sharing routes when consents are pending", () => {
    mockUsePathname.mockReturnValue("/settings");
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: { requires_action: true },
      isLoading: false,
    });

    const { getByText } = render(<AuthLayout />);

    expect(getByText("auth-stack")).toBeTruthy();
  });
});
