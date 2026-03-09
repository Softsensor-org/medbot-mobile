import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import ConsentScreen from "../app/(auth)/consent";
import { useConsentTypes, useConsentStatus, useRecordConsent } from "../src/hooks/useConsent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ back: jest.fn(), push: jest.fn() })),
}));

jest.mock("../src/hooks/useConsent", () => ({
  useConsentTypes: jest.fn(),
  useConsentStatus: jest.fn(),
  useRecordConsent: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
}));

jest.mock("react-native-markdown-display", () => {
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => <Text>{children}</Text>,
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const MOCK_TYPES = [
  {
    id: "privacy_notice",
    title: "Privacy Notice",
    description: "How we handle your data.",
    type: "required" as const,
    requires_signature: false,
    content_markdown: "## Privacy\n\nYour data is encrypted.",
    version: "1.0",
    active: true,
  },
  {
    id: "telehealth_disclaimer",
    title: "Telehealth Disclaimer",
    description: "AI limitations.",
    type: "required" as const,
    requires_signature: true,
    content_markdown: "## Telehealth\n\nThis is not a replacement for a doctor.",
    version: "1.0",
    active: true,
  },
  {
    id: "research_opt_in",
    title: "Research Opt-In",
    description: "Optional research participation.",
    type: "optional" as const,
    requires_signature: false,
    content_markdown: "## Research\n\nHelp improve skin health.",
    version: "1.0",
    active: true,
  },
];

function mockStatus(overrides: Partial<ReturnType<typeof useConsentStatus>["data"]> = {}) {
  return {
    requires_action: false,
    pending_required: [],
    pending_optional: [],
    expired_consents: [],
    accepted_required: [],
    accepted_optional: [],
    ...overrides,
  };
}

const mockMutateAsync = jest.fn().mockResolvedValue({});

describe("ConsentScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRecordConsent as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
    });
  });

  it("renders loading state", () => {
    (useConsentTypes as jest.Mock).mockReturnValue({ data: null, isLoading: true });
    (useConsentStatus as jest.Mock).mockReturnValue({ data: null, isLoading: true });

    const { getByText } = render(<ConsentScreen />, { wrapper });

    expect(getByText("Your Privacy & Consent")).toBeTruthy();
  });

  it("renders consent types with summaries", () => {
    (useConsentTypes as jest.Mock).mockReturnValue({
      data: MOCK_TYPES,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: mockStatus(),
      isLoading: false,
    });

    const { getByText } = render(<ConsentScreen />, { wrapper });

    expect(getByText("Privacy Notice")).toBeTruthy();
    expect(getByText("Telehealth Disclaimer")).toBeTruthy();
    expect(getByText("Research Opt-In")).toBeTruthy();
    // Summaries visible
    expect(getByText(/how your health data is stored/i)).toBeTruthy();
  });

  it("shows action banner when consents are pending", () => {
    (useConsentTypes as jest.Mock).mockReturnValue({
      data: MOCK_TYPES,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: mockStatus({
        requires_action: true,
        pending_required: [
          {
            id: "privacy_notice",
            consent_type_id: "privacy_notice",
            title: "Privacy Notice",
            type: "required",
            status: "pending",
            version: "1.0",
            current_version: "1.0",
            version_match: true,
            expired: false,
          },
        ],
      }),
      isLoading: false,
    });

    const { getByText } = render(<ConsentScreen />, { wrapper });

    expect(getByText(/need your attention/i)).toBeTruthy();
  });

  it("shows complete banner when all consents satisfied", () => {
    (useConsentTypes as jest.Mock).mockReturnValue({
      data: MOCK_TYPES,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: mockStatus({
        requires_action: false,
        accepted_required: [
          {
            id: "privacy_notice",
            consent_type_id: "privacy_notice",
            title: "Privacy Notice",
            type: "required",
            status: "accepted",
            version: "1.0",
            consent_version: "1.0",
            current_version: "1.0",
            version_match: true,
            expired: false,
          },
        ],
      }),
      isLoading: false,
    });

    const { getByText } = render(<ConsentScreen />, { wrapper });

    expect(getByText(/up to date/i)).toBeTruthy();
  });

  it("expands card to show markdown content", () => {
    (useConsentTypes as jest.Mock).mockReturnValue({
      data: MOCK_TYPES,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: mockStatus(),
      isLoading: false,
    });

    const { getByTestId, getByText } = render(<ConsentScreen />, { wrapper });

    fireEvent.press(getByTestId("consent-card-privacy_notice"));

    // Markdown content rendered
    expect(getByText(/Your data is encrypted/i)).toBeTruthy();
    expect(getByText("Version 1.0")).toBeTruthy();
  });

  it("accepts consent without signature", async () => {
    (useConsentTypes as jest.Mock).mockReturnValue({
      data: MOCK_TYPES,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: mockStatus(),
      isLoading: false,
    });

    const { getByTestId } = render(<ConsentScreen />, { wrapper });

    // Expand card
    fireEvent.press(getByTestId("consent-card-privacy_notice"));

    // Accept
    await act(async () => {
      fireEvent.press(getByTestId("accept-button-privacy_notice"));
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      consent_type_id: "privacy_notice",
      status: "accepted",
      consent_version: "1.0",
      signature: undefined,
      source: "mobile_app",
    });
  });

  it("requires signature before accepting when required", () => {
    (useConsentTypes as jest.Mock).mockReturnValue({
      data: MOCK_TYPES,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: mockStatus(),
      isLoading: false,
    });

    const { getByTestId } = render(<ConsentScreen />, { wrapper });

    // Expand telehealth (requires signature)
    fireEvent.press(getByTestId("consent-card-telehealth_disclaimer"));

    // Button should be disabled without signature
    const button = getByTestId("accept-button-telehealth_disclaimer");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("accepts consent with signature when provided", async () => {
    (useConsentTypes as jest.Mock).mockReturnValue({
      data: MOCK_TYPES,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: mockStatus(),
      isLoading: false,
    });

    const { getByTestId } = render(<ConsentScreen />, { wrapper });

    // Expand telehealth
    fireEvent.press(getByTestId("consent-card-telehealth_disclaimer"));

    // Type signature
    fireEvent.changeText(
      getByTestId("signature-input-telehealth_disclaimer"),
      "John Doe"
    );

    // Accept
    await act(async () => {
      fireEvent.press(getByTestId("accept-button-telehealth_disclaimer"));
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      consent_type_id: "telehealth_disclaimer",
      status: "accepted",
      consent_version: "1.0",
      signature: "John Doe",
      source: "mobile_app",
    });
  });

  it("shows accepted badge for completed consents", () => {
    (useConsentTypes as jest.Mock).mockReturnValue({
      data: MOCK_TYPES,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: mockStatus({
        accepted_required: [
          {
            id: "privacy_notice",
            consent_type_id: "privacy_notice",
            title: "Privacy Notice",
            type: "required",
            status: "accepted",
            version: "1.0",
            consent_version: "1.0",
            current_version: "1.0",
            version_match: true,
            expired: false,
          },
        ],
      }),
      isLoading: false,
    });

    const { getAllByText } = render(<ConsentScreen />, { wrapper });

    expect(getAllByText("Accepted").length).toBeGreaterThanOrEqual(1);
  });

  it("shows expired badge for expired consents", () => {
    (useConsentTypes as jest.Mock).mockReturnValue({
      data: MOCK_TYPES,
      isLoading: false,
    });
    (useConsentStatus as jest.Mock).mockReturnValue({
      data: mockStatus({
        requires_action: true,
        expired_consents: [
          {
            id: "privacy_notice",
            consent_type_id: "privacy_notice",
            title: "Privacy Notice",
            type: "required",
            status: "accepted",
            version: "1.0",
            consent_version: "1.0",
            current_version: "1.0",
            version_match: true,
            expired: true,
          },
        ],
      }),
      isLoading: false,
    });

    const { getByText } = render(<ConsentScreen />, { wrapper });

    expect(getByText("Expired")).toBeTruthy();
  });
});
