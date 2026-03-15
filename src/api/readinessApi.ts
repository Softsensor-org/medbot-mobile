import { BaseApiService } from "./BaseApiService";

export interface RiskFlagSummary {
  has_red_flags: boolean;
  red_flag_categories: string[];
  triage_label: string | null;
  confidence_band: string | null;
  escalation_active: boolean;
}

export interface InterventionHighlight {
  date: string;
  description: string;
  event_type: string;
}

export interface ReadinessSummary {
  readiness_score: number;
  status: "ready" | "needs_attention" | "not_ready";
  next_action: string;
  evidence_completeness: number;
  adherence_rate: number;
  risk_flags: RiskFlagSummary;
  intervention_highlights: InterventionHighlight[];
  photo_count: number;
  session_count: number;
}

export interface PrepChecklistItem {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  progress: number | null;
}

export interface PrepChecklistResponse {
  journey_stage: string;
  readiness_score: number;
  readiness_status: string;
  items: PrepChecklistItem[];
  prep_guidance: string;
  next_action: string;
  completion_percent: number;
}

class ReadinessApiService extends BaseApiService {
  constructor() {
    super("/api/v1/readiness");
  }

  async getSummary(days: number = 30): Promise<ReadinessSummary> {
    return this.get<ReadinessSummary>("/summary", { params: { days } });
  }

  async getPrepChecklist(days: number = 30): Promise<PrepChecklistResponse> {
    return this.get<PrepChecklistResponse>("/prep-checklist", { params: { days } });
  }
}

export const readinessApi = new ReadinessApiService();
