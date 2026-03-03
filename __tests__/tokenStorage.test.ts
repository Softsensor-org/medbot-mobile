import * as SecureStore from "expo-secure-store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
} from "../src/auth/tokenStorage";

const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItem = SecureStore.deleteItemAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("tokenStorage", () => {
  it("getAccessToken reads from SecureStore", async () => {
    mockGetItem.mockResolvedValue("test-access-token");
    const token = await getAccessToken();
    expect(token).toBe("test-access-token");
    expect(mockGetItem).toHaveBeenCalledWith("medbot_access_token");
  });

  it("getAccessToken returns null when no token stored", async () => {
    mockGetItem.mockResolvedValue(null);
    const token = await getAccessToken();
    expect(token).toBeNull();
  });

  it("setAccessToken writes to SecureStore", async () => {
    mockSetItem.mockResolvedValue(undefined);
    await setAccessToken("new-token");
    expect(mockSetItem).toHaveBeenCalledWith("medbot_access_token", "new-token");
  });

  it("getRefreshToken reads from SecureStore", async () => {
    mockGetItem.mockResolvedValue("test-refresh-token");
    const token = await getRefreshToken();
    expect(token).toBe("test-refresh-token");
    expect(mockGetItem).toHaveBeenCalledWith("medbot_refresh_token");
  });

  it("setRefreshToken writes to SecureStore", async () => {
    mockSetItem.mockResolvedValue(undefined);
    await setRefreshToken("refresh-123");
    expect(mockSetItem).toHaveBeenCalledWith("medbot_refresh_token", "refresh-123");
  });

  it("clearTokens deletes both tokens", async () => {
    mockDeleteItem.mockResolvedValue(undefined);
    await clearTokens();
    expect(mockDeleteItem).toHaveBeenCalledWith("medbot_access_token");
    expect(mockDeleteItem).toHaveBeenCalledWith("medbot_refresh_token");
    expect(mockDeleteItem).toHaveBeenCalledTimes(2);
  });
});
