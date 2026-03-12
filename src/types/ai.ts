export type TriageLabel = "self_care" | "clinician_review" | "urgent";

export type ConfidenceBand = "Low" | "Moderate" | "High";

export type EvidenceSlotState = "provided" | "unknown" | "pending";

export interface EvidenceSlot {
  name: string;
  state: EvidenceSlotState;
  value?: string | null;
}

export interface RecommendedAction {
  id?: string;
  label: string;
  detail?: string;
  requires_follow_up?: boolean;
}

export interface ModelOutput {
  triage_label: TriageLabel;
  summary_for_patient: string;
  summary_for_doctor: string;
  red_flags_acknowledged: string[];
  recommended_actions: (RecommendedAction | string)[];
  confidence_band: ConfidenceBand;
  evidence_slots?: EvidenceSlot[];
  evidence_completeness?: number;
  missing_evidence?: string[];
  is_preliminary?: boolean;
  photo_quality?: PhotoQualityAnalysis;
  disclaimers?: string[];
  generated_at?: string;
  symptom_capture_hint?: SymptomCaptureHint;
  cards?: ChatCard[];
  escalation_required?: boolean;
  escalation_category?: string | null;
  escalation_guidance?: string | null;
}

// --- Discriminated union for non-streaming /medical_chat responses ---

export interface ClarificationResponse {
  response_type: "clarification";
  message: string;
  suggestions: string[];
  intent: "greeting" | "insufficient";
}

export interface ModelOutputResponse {
  response_type: "model_output";
  triage_label: TriageLabel;
  summary_for_patient: string;
  summary_for_doctor: string;
  red_flags_acknowledged: string[];
  recommended_actions: string[];
  confidence_band: ConfidenceBand;
  evidence_slots?: EvidenceSlot[];
  evidence_completeness?: number;
  missing_evidence?: string[];
  is_preliminary?: boolean;
  photo_quality?: PhotoQualityAnalysis;
  symptom_capture_hint?: SymptomCaptureHint;
  escalation_required?: boolean;
  escalation_category?: string | null;
  escalation_guidance?: string | null;
}

/** The `data` field of a successful /medical_chat JSON response. */
export type ChatResponse = ClarificationResponse | ModelOutputResponse;

// --- Evidence Snapshot (MB-203) ---

export interface EvidenceSnapshotSlot {
  name: string;
  state: EvidenceSlotState;
  value?: string | null;
}

export interface PhotoQualityIssue {
  type: "blur" | "lighting" | "composition" | "resolution" | "no_lesion_found";
  severity: "low" | "medium" | "high";
  description: string;
  suggestion: string;
}

export interface PhotoQualityAnalysis {
  overall_quality: "poor" | "fair" | "good" | "excellent";
  blur_score: number;
  lighting_score: number;
  is_acceptable: boolean;
  issues: PhotoQualityIssue[];
  recommendations: string[];
}

export interface EvidenceSnapshot {
  session_id: string;
  evidence_completeness: number;
  slots: EvidenceSnapshotSlot[];
  missing_evidence: string[];
  red_flags: string[];
  has_image: boolean;
  triage_label?: TriageLabel | null;
  confidence_band?: ConfidenceBand | null;
  is_preliminary: boolean;
}

export interface ProviderPacket extends Omit<EvidenceSnapshot, "has_image" | "is_preliminary"> {
  shared_at: string;
  patient_id: string;
  summary_for_doctor?: string;
}

// --- Structured Timeline Events (MB-602) ---

export type EventType = "symptom_event" | "routine_event" | "product_event" | "safety_event";

export interface SymptomEvent {
  event_type: "symptom_event";
  session_id: string;
  timestamp: string;
  symptom_terms: string[];
  body_parts: string[];
  severity?: string | null;
  image_present: boolean;
  triage_label?: string | null;
}

export interface RoutineEvent {
  event_type: "routine_event";
  session_id: string;
  timestamp: string;
  routine_type?: string | null;
  action?: string | null;
  keywords: string[];
}

export interface ProductEvent {
  event_type: "product_event";
  session_id: string;
  timestamp: string;
  product_terms: string[];
  query_type?: string | null;
}

export interface SafetyEvent {
  event_type: "safety_event";
  session_id: string;
  timestamp: string;
  trigger: string;
  categories: string[];
  triage_before?: string | null;
  triage_after?: string | null;
  escalation_reason?: string | null;
  confidence_band?: string | null;
}

export type TimelineEvent = SymptomEvent | RoutineEvent | ProductEvent | SafetyEvent;

// --- PTN-001: Symptom Capture Hint ---

export interface SymptomCaptureHint {
  suggest: boolean;
  symptom_terms: string[];
  body_parts: string[];
  severity?: string | null;
  duration?: string | null;
}

// --- IMP-242: Structured Chat Output Cards ---

export type CardType = "symptom" | "product" | "routine" | "intervention" | "summary" | "escalation";
export type CardStatus = "draft" | "confirmed" | "dismissed" | "flagged";

export interface ChatCard {
  card_id: string;
  card_type: CardType;
  status: CardStatus;
  confidence: number;
  data: Record<string, unknown>;
  source_turn: number;
  editable_fields: string[];
}

// --- IMP-249: Provider Brief ---

export interface ProviderBriefAnnotation {
  author: string;
  comment: string;
  created_at: string;
}

export interface ProviderBrief {
  session_id: string;
  chief_complaint: string;
  symptom_context: string;
  adherence_snapshot: string;
  interventions: string[];
  focus_areas: string[];
  safety_flags: string[];
  triage_label?: string | null;
  turn_count: number;
  generated_at: string;
  flagged: boolean;
  annotations: ProviderBriefAnnotation[];
}

// --- SSE streaming events for /medical_chat_stream ---

export type ModelStreamEvent =
  | { type: "ack"; content?: string }
  | { type: "token"; content: string }
  | { type: "card"; card: ChatCard }
  | { type: "complete"; model_output?: ModelOutput }
  | { type: "clarification"; content: string; suggestions: string[] }
  | { type: "error"; content?: string }
  | { type: "debug"; payload: unknown };
