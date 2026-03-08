import { BaseApiService } from "./BaseApiService";
import type { EvidenceSnapshot, TriageLabel, ConfidenceBand } from "../types/ai";
import type { SessionListParams } from "../queryKeys";

export interface SessionMeta {
  session_id: string;
  created_at: string;
  updated_at: string;
  status: "new" | "active" | "resolved" | "escalated";
  triage_label: TriageLabel;
  confidence_band: ConfidenceBand;
  priority_score: number;
  last_message_at?: string;
  message_count?: number;
}

export interface SessionListResponse {
  sessions: SessionMeta[];
  count: number;
}

export interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

class SessionsApiService extends BaseApiService {
  constructor() {
    super("/api/v1/medical/sessions");
  }

  async list(params?: SessionListParams): Promise<SessionListResponse> {
    return this.get<SessionListResponse>("", { params });
  }

  async getDetail(sessionId: string): Promise<{ session: SessionMeta }> {
    return this.get<{ session: SessionMeta }>(`/${sessionId}`);
  }

  async getTranscript(sessionId: string): Promise<{ transcript: TranscriptMessage[] }> {
    return this.get<{ transcript: TranscriptMessage[] }>(`/${sessionId}/transcript`);
  }

  async getEvidenceSnapshot(sessionId: string): Promise<EvidenceSnapshot> {
    return this.get<EvidenceSnapshot>(`/${sessionId}/evidence-snapshot`);
  }

  async sharePacket(sessionId: string): Promise<any> {
    return this.post<any>(`/${sessionId}/share`);
  }

  async getPacket(sessionId: string): Promise<any> {
    return this.get<any>(`/${sessionId}/packet`);
  }
}

export const sessionsApi = new SessionsApiService();
