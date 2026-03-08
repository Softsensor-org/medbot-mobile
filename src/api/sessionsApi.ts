/**
 * IMP-161: Session API service aligned to backend contract.
 *
 * Backend response shapes (after SuccessResponse envelope unwrap):
 * - list: SessionMeta[]  (bare array)
 * - detail: SessionMeta  (bare object)
 * - transcript: TranscriptMessage[]  (bare array)
 */

import { BaseApiService } from "./BaseApiService";
import type { EvidenceSnapshot } from "../types/ai";
import type { SessionListParams } from "../queryKeys";

/** Matches backend app.schemas.sessions.SessionNote */
export interface SessionNote {
  id: string;
  content: string;
  visibility: "internal" | "patient";
  author?: string;
  created_at?: string;
}

/** Matches backend app.schemas.sessions.TimelineEvent */
export interface TimelineEvent {
  event_type: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Matches backend app.schemas.sessions.SessionMeta.
 *
 * Status enum: new/waiting/assigned/closed (backend canonical).
 * Note: triage_label and confidence_band are NOT included here because the
 * backend Pydantic SessionMeta model drops them during validation.
 * See IMP-162 for safety-gate implications.
 */
export interface SessionMeta {
  session_id: string;
  status: "new" | "waiting" | "assigned" | "closed";
  assignee?: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  notes?: SessionNote[];
  priority_score?: number;
  age_minutes?: number;
  sla_target_minutes?: number;
  consent_given?: boolean;
  consent_at?: string | null;
  timeline_events?: TimelineEvent[];
}

export interface TranscriptMessage {
  role: "user" | "assistant" | "system";
  content: string;
  /** Used for local optimistic messages; not always present from backend. */
  timestamp?: string;
  model_output?: Record<string, unknown>;
}

class SessionsApiService extends BaseApiService {
  constructor() {
    super("/api/v1/medical/sessions");
  }

  /** Backend returns bare SessionMeta[] array. */
  async list(params?: SessionListParams): Promise<SessionMeta[]> {
    return this.get<SessionMeta[]>("", { params });
  }

  /** Backend returns bare SessionMeta object. */
  async getDetail(sessionId: string): Promise<SessionMeta> {
    return this.get<SessionMeta>(`/${sessionId}`);
  }

  /** Backend returns bare TranscriptMessage[] array. */
  async getTranscript(sessionId: string): Promise<TranscriptMessage[]> {
    return this.get<TranscriptMessage[]>(`/${sessionId}/transcript`);
  }

  async getEvidenceSnapshot(sessionId: string): Promise<EvidenceSnapshot> {
    return this.get<EvidenceSnapshot>(`/${sessionId}/evidence-snapshot`);
  }

  async sharePacket(sessionId: string): Promise<unknown> {
    return this.post<unknown>(`/${sessionId}/share`);
  }

  async getPacket(sessionId: string): Promise<unknown> {
    return this.get<unknown>(`/${sessionId}/packet`);
  }
}

export const sessionsApi = new SessionsApiService();
