jest.mock("../src/api/client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import client from "../src/api/client";
import { BaseApiService } from "../src/api/BaseApiService";

const mockClient = client as jest.Mocked<typeof client>;

// Subclass to expose protected methods for testing
class TestService extends BaseApiService {
  constructor() {
    super("/api/v1");
  }
  testGet<T>(path: string) {
    return this.get<T>(path);
  }
  testPost<T>(path: string, data?: unknown) {
    return this.post<T>(path, data);
  }
  testPatch<T>(path: string, data?: unknown) {
    return this.patch<T>(path, data);
  }
  testDelete<T>(path: string) {
    return this.delete<T>(path);
  }
}

let service: TestService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new TestService();
});

describe("BaseApiService", () => {
  describe("envelope unwrapping", () => {
    it("unwraps successful response data", async () => {
      mockClient.get.mockResolvedValue({
        data: { success: true, data: { id: 1, name: "test" } },
      });
      const result = await service.testGet<{ id: number; name: string }>("/items");
      expect(result).toEqual({ id: 1, name: "test" });
      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/items", undefined);
    });

    it("throws on error response with message", async () => {
      mockClient.get.mockResolvedValue({
        data: { success: false, error: "Not found" },
      });
      await expect(service.testGet("/missing")).rejects.toThrow("Not found");
    });

    it("throws default message when error response has no error field", async () => {
      mockClient.get.mockResolvedValue({
        data: { success: false },
      });
      await expect(service.testGet("/bad")).rejects.toThrow("API request failed");
    });
  });

  describe("HTTP methods", () => {
    it("POST sends data in body", async () => {
      mockClient.post.mockResolvedValue({
        data: { success: true, data: { id: 2 } },
      });
      const result = await service.testPost("/items", { name: "new" });
      expect(result).toEqual({ id: 2 });
      expect(mockClient.post).toHaveBeenCalledWith("/api/v1/items", { name: "new" }, undefined);
    });

    it("PATCH sends partial data", async () => {
      mockClient.patch.mockResolvedValue({
        data: { success: true, data: { id: 1, name: "updated" } },
      });
      const result = await service.testPatch("/items/1", { name: "updated" });
      expect(result).toEqual({ id: 1, name: "updated" });
    });

    it("DELETE calls correct endpoint", async () => {
      mockClient.delete.mockResolvedValue({
        data: { success: true, data: null },
      });
      const result = await service.testDelete("/items/1");
      expect(result).toBeNull();
      expect(mockClient.delete).toHaveBeenCalledWith("/api/v1/items/1", undefined);
    });
  });

  describe("URL construction", () => {
    it("prefixes paths with the service prefix", async () => {
      mockClient.get.mockResolvedValue({
        data: { success: true, data: [] },
      });
      await service.testGet("/things");
      expect(mockClient.get).toHaveBeenCalledWith("/api/v1/things", undefined);
    });
  });
});
