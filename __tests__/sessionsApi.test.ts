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

  describe("IMP-161: normalized response shapes", () => {
    it("list returns bare SessionMeta array (not { sessions, count })", async () => {
      const sessions = [
        {
          session_id: "1",
          status: "new",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          last_message_at: "2026-01-01T00:00:00Z",
        },
      ];
      mockClient.get.mockResolvedValue({
        data: { success: true, data: sessions },
      });

      const result = await sessionsApi.list({
        sort_by: "updated_at",
        sort_order: "desc",
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(sessions);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/api/v1/medical/sessions",
        { params: { sort_by: "updated_at", sort_order: "desc" } },
      );
    });

    it("getDetail returns bare SessionMeta (not { session: ... })", async () => {
      const session = {
        session_id: "123",
        status: "waiting",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        last_message_at: "2026-01-01T00:00:00Z",
      };
      mockClient.get.mockResolvedValue({
        data: { success: true, data: session },
      });

      const result = await sessionsApi.getDetail("123");

      expect(result).toEqual(session);
      expect(result).not.toHaveProperty("session");
      expect(mockClient.get).toHaveBeenCalledWith(
        "/api/v1/medical/sessions/123",
        undefined,
      );
    });

    it("getTranscript returns bare TranscriptMessage array (not { transcript: ... })", async () => {
      const transcript = [
        { role: "user", content: "hello" },
        { role: "assistant", content: "Hi there" },
      ];
      mockClient.get.mockResolvedValue({
        data: { success: true, data: transcript },
      });

      const result = await sessionsApi.getTranscript("123");

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(transcript);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/api/v1/medical/sessions/123/transcript",
        undefined,
      );
    });
  });

  describe("contract paths", () => {
    it("evidence snapshot uses correct path", async () => {
      mockClient.get.mockResolvedValue({
        data: { success: true, data: {} },
      });

      await sessionsApi.getEvidenceSnapshot("abc");
      expect(mockClient.get).toHaveBeenCalledWith(
        "/api/v1/medical/sessions/abc/evidence-snapshot",
        undefined,
      );
    });

    it("share packet uses correct path", async () => {
      mockClient.post.mockResolvedValue({
        data: { success: true, data: {} },
      });

      await sessionsApi.sharePacket("abc");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/api/v1/medical/sessions/abc/share",
        undefined,
        undefined,
      );
    });
  });
});
