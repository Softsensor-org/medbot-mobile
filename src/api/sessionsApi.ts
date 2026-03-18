/**
 * IMP-161: Session API service aligned to backend contract.
 *
 * Backend response shapes (after SuccessResponse envelope unwrap):
 * - list: SessionMeta[]  (bare array)
 * - detail: SessionMeta  (bare object)
 * - transcript: TranscriptMessage[]  (bare array)
 */

import { BaseApiService } from "./BaseApiService";
import type { EvidenceSnapshot, ChatCard } from "../types/ai";
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
  queue_lane?: "prep_review" | "recovery_follow_up" | "adherence_risk" | "product_conflict" | "clinical_review";
  queue_time_state?: "on_track" | "due_soon" | "due_now" | "overdue";
  queue_reasons?: string[];
  recommended_next_action?: string;
  queue_owner?: string;
  treatment_stage?: "intake" | "prep" | "treatment" | "recovery" | "maintenance" | "rebook_next_step";
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

  /** IMP-245: Trigger session summarization, returns a summary ChatCard. */
  async summarizeSession(sessionId: string): Promise<ChatCard> {
    return this.post<ChatCard>(`/${sessionId}/summarize`);
  }

  /** IMP-245: Flag a card for provider correction.
   *  Card endpoints are under /api/v1/medical/cards/, not /sessions/.
   */
  async flagCard(cardId: string): Promise<ChatCard> {
    const { default: client } = await import("./client");
    const res = await client.post(`/api/v1/medical/cards/${cardId}/flag`);
    const body = res.data;
    if (!body.success) throw new Error(body.error ?? "Failed to flag card");
    return body.data as ChatCard;
  }
}

export const sessionsApi = new SessionsApiService();
