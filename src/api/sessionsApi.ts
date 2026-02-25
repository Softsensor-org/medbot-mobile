import { BaseApiService } from "./BaseApiService";
import type { EvidenceSnapshot } from "../types/ai";
import type { SessionListParams } from "../queryKeys";

export interface SessionMeta {
  session_id: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  triage_label?: string;
  message_count?: number;
}

export interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

class SessionsApiService extends BaseApiService {
  constructor() {
    super("/api/v1/sessions");
  }

  async list(params?: SessionListParams): Promise<SessionMeta[]> {
    return this.get<SessionMeta[]>("", { params });
  }

  async getDetail(sessionId: string): Promise<SessionMeta> {
    return this.get<SessionMeta>(`/${sessionId}`);
  }

  async getTranscript(sessionId: string): Promise<TranscriptMessage[]> {
    return this.get<TranscriptMessage[]>(`/${sessionId}/transcript`);
  }

  async getEvidenceSnapshot(sessionId: string): Promise<EvidenceSnapshot> {
    return this.get<EvidenceSnapshot>(`/${sessionId}/evidence-snapshot`);
  }
}

export const sessionsApi = new SessionsApiService();
