// Undo the global client mock from setup.ts so we can test the real module
jest.unmock("../src/api/client");

const mockRequestUse = jest.fn();
const mockResponseUse = jest.fn();
const mockInstance = {
  interceptors: {
    request: { use: mockRequestUse },
    response: { use: mockResponseUse },
  },
};

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => mockInstance),
  },
}));

jest.mock("axios-retry", () => ({
  __esModule: true,
  default: jest.fn(),
  isNetworkOrIdempotentRequestError: jest.fn(),
  exponentialDelay: jest.fn(),
}));

jest.mock("../src/auth/tokenStorage", () => ({
  getAccessToken: jest.fn(),
}));

jest.mock("../src/api/config", () => ({
  API_BASE_URL: "http://test-api.local",
  APP_VERSION: "2.0.0",
  APP_PLATFORM: "android",
}));

jest.unmock("../src/api/client");

import { getAccessToken } from "../src/auth/tokenStorage";

const mockGetAccessToken = getAccessToken as jest.Mock;

// Import client module to trigger interceptor registration
require("../src/api/client");

describe("client interceptors", () => {
  let requestInterceptor: (config: { headers: Record<string, string> }) => Promise<{ headers: Record<string, string> }>;

  beforeAll(() => {
    // The request interceptor is the first argument to interceptors.request.use
    expect(mockRequestUse).toHaveBeenCalledTimes(1);
    requestInterceptor = mockRequestUse.mock.calls[0][0];
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("attaches Bearer token when access token exists", async () => {
    mockGetAccessToken.mockResolvedValue("my-jwt-token");
    const config = { headers: {} as Record<string, string> };
    const result = await requestInterceptor(config);
    expect(result.headers.Authorization).toBe("Bearer my-jwt-token");
  });

  it("does not set Authorization header when no token", async () => {
    mockGetAccessToken.mockResolvedValue(null);
    const config = { headers: {} as Record<string, string> };
    const result = await requestInterceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it("sets X-App-Version header", async () => {
    mockGetAccessToken.mockResolvedValue(null);
    const config = { headers: {} as Record<string, string> };
    const result = await requestInterceptor(config);
    expect(result.headers["X-App-Version"]).toBe("2.0.0");
  });

  it("sets X-App-Platform header", async () => {
    mockGetAccessToken.mockResolvedValue(null);
    const config = { headers: {} as Record<string, string> };
    const result = await requestInterceptor(config);
    expect(result.headers["X-App-Platform"]).toBe("android");
  });
});
