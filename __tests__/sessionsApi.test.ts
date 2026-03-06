jest.mock("../src/api/client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import client from "../src/api/client";
import { sessionsApi } from "../src/api/sessionsApi";

const mockClient = client as jest.Mocked<typeof client>;

describe("sessionsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists sessions with correct URL and params", async () => {
    const mockResponse = {
      success: true,
      data: {
        sessions: [{ session_id: "1", status: "active" }],
        count: 1,
      },
    };
    mockClient.get.mockResolvedValue({ data: mockResponse });

    const params = { sort_by: "updated_at", sort_order: "desc" as const };
    const result = await sessionsApi.list(params);

    expect(result).toEqual(mockResponse.data);
    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/medical/sessions", { params });
  });

  it("gets session detail", async () => {
    const mockResponse = {
      success: true,
      data: {
        session: { session_id: "123", status: "active" },
      },
    };
    mockClient.get.mockResolvedValue({ data: mockResponse });

    const result = await sessionsApi.getDetail("123");

    expect(result).toEqual(mockResponse.data);
    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/medical/sessions/123", undefined);
  });

  it("gets transcript", async () => {
    const mockResponse = {
      success: true,
      data: {
        transcript: [{ role: "user", content: "hello" }],
      },
    };
    mockClient.get.mockResolvedValue({ data: mockResponse });

    const result = await sessionsApi.getTranscript("123");

    expect(result).toEqual(mockResponse.data);
    expect(mockClient.get).toHaveBeenCalledWith("/api/v1/medical/sessions/123/transcript", undefined);
  });
});
