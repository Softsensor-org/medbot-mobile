jest.mock("../src/api/client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import client from "../src/api/client";
import {
  getCapabilities,
  hasCapability,
  resetCapabilities,
} from "../src/api/capabilityGuard";

const mockClient = client as jest.Mocked<typeof client>;

describe("capabilityGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCapabilities();
  });

  it("merges server modules with defaults", async () => {
    mockClient.get.mockResolvedValue({
      data: {
        modules: {
          calendar: true,
          routines: true,
        },
      },
    } as never);

    const caps = await getCapabilities();

    expect(caps.modules.calendar).toBe(true);
    expect(caps.modules.routines).toBe(true);
    expect(caps.modules.medical_chat).toBe(true);
    expect(caps.modules.usage).toBe(false);
  });

  it("caches the first successful response", async () => {
    mockClient.get.mockResolvedValue({
      data: {
        modules: {
          calendar: true,
        },
      },
    } as never);

    await getCapabilities();
    await getCapabilities();

    expect(mockClient.get).toHaveBeenCalledTimes(1);
  });

  it("falls back to safe defaults when endpoint fails", async () => {
    mockClient.get.mockRejectedValue(new Error("network down"));

    const caps = await getCapabilities();

    expect(caps.modules.medical_chat).toBe(true);
    expect(caps.modules.sessions).toBe(true);
    expect(caps.modules.calendar).toBe(false);
    expect(caps.modules.usage).toBe(false);
  });

  it("evaluates individual module capability", async () => {
    mockClient.get.mockResolvedValue({
      data: {
        modules: {
          usage: true,
        },
      },
    } as never);

    await expect(hasCapability("usage")).resolves.toBe(true);
    await expect(hasCapability("calendar")).resolves.toBe(false);
  });
});
