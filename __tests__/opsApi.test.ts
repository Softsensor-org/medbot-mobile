jest.mock("../src/api/client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import client from "../src/api/client";
import { opsApi } from "../src/api/opsApi";

const mockClient = client as jest.Mocked<typeof client>;

describe("opsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("IMP-207: canonical KPI endpoint paths", () => {
    it("calls /api/v1/ops/kpi for operational KPI snapshot", async () => {
      const mockResponse = {
        success: true,
        data: { snapshot: {}, alerts: [] },
      };
      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await opsApi.getKpiSnapshot();

      expect(result).toEqual(mockResponse.data);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/api/v1/ops/kpi",
        undefined,
      );
    });

    it("calls /api/v1/ops/aspirational/kpis for aspirational KPIs", async () => {
      const mockResponse = {
        success: true,
        data: {
          snapshot: {},
          decision: {},
          thresholds: {},
          feature_flag: false,
        },
      };
      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await opsApi.getAspirationalKpis(60);

      expect(result).toEqual(mockResponse.data);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/api/v1/ops/aspirational/kpis",
        { params: { days: 60 } },
      );
    });

    it("calls /api/v1/ops/aspirational/flag for flag status", async () => {
      const mockResponse = {
        success: true,
        data: { enabled: false, env_var: "ENABLE_ASPIRATIONAL_WAVE" },
      };
      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await opsApi.getAspirationalFlag();

      expect(result).toEqual(mockResponse.data);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/api/v1/ops/aspirational/flag",
        undefined,
      );
    });

    it("defaults days param to 30 for aspirational KPIs", async () => {
      const mockResponse = {
        success: true,
        data: {
          snapshot: {},
          decision: {},
          thresholds: {},
          feature_flag: false,
        },
      };
      mockClient.get.mockResolvedValue({ data: mockResponse });

      await opsApi.getAspirationalKpis();

      expect(mockClient.get).toHaveBeenCalledWith(
        "/api/v1/ops/aspirational/kpis",
        { params: { days: 30 } },
      );
    });
  });
});
