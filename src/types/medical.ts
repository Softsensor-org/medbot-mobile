export interface SymptomType {
  id: number;
  name: string;
  description: string;
  category: string;
}

export interface Symptom {
  id?: number;
  symptom_type_id: number;
  occurred_at: string;
  severity: number;
  description: string;
  notes?: string;
  created_at?: string;
}

export type RoutineCategory = "active" | "template" | "history";

export interface RoutineStep {
  id?: number;
  routine_id?: number;
  name: string;
  description: string;
  step_order: number;
}

export interface Routine {
  id?: number;
  name: string;
  description: string;
  patient_id?: string;
  assigned_by?: string;
  assigned_at?: string;
  recurrence?: Record<string, unknown>; // Scheduling blob
  day_part?: 'morning' | 'afternoon' | 'evening';
  category?: RoutineCategory;
  active: boolean;
  steps: RoutineStep[];
}

export interface RoutineFocusSummary {
  kind: "current" | "next" | "none";
  routine_id?: number;
  assignment_id?: number;
  routine_name?: string | null;
  day_part?: "morning" | "afternoon" | "evening" | string | null;
  estimated_duration_minutes?: number | null;
  estimated_duration_basis?: string | null;
}

export interface RoutineAdherenceSnapshot {
  adherence_rate_7d?: number | null;
  logged_events_7d: number;
  deferred_or_skipped_7d: number;
  current_streak?: number | null;
  longest_streak?: number | null;
  streak_routine_id?: number | null;
  streak_routine_name?: string | null;
}

export type RoutineRecoveryState =
  | "on_track"
  | "snoozed"
  | "deferred"
  | "recovery_due"
  | "completed"
  | "cancelled";

export type RoutineRecoveryRecommendedAction =
  | "complete"
  | "resume"
  | "defer"
  | "review"
  | "none";

export interface RoutineRecoverySummary {
  state: RoutineRecoveryState;
  headline: string;
  detail: string;
  recommended_action: RoutineRecoveryRecommendedAction;
  source_event_type?: "assigned" | "accepted" | "completed" | "deferred" | "snoozed" | "skipped" | "edited" | null;
  next_target_at?: string | null;
  provider_follow_up: boolean;
  follow_up_reason?: string | null;
}

export interface RoutineIntelligenceSummary {
  patient_id: string;
  focus: RoutineFocusSummary;
  adherence: RoutineAdherenceSnapshot;
  recovery: RoutineRecoverySummary;
  generated_at: string;
}

export type RoutineAssignmentStatus = "active" | "deferred" | "completed" | "cancelled";

export type RescheduleIntentType = "later_today" | "tomorrow" | "specific_time" | "skip_for_now";

export interface RescheduleIntent {
  type: RescheduleIntentType;
  target_at?: string;
}

export interface RoutineAssignment {
  id: number;
  routine_id: number;
  patient_id: string;
  provider_id?: string | null;
  status: RoutineAssignmentStatus;
  accepted_at?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  defer_reason_code?: string | null;
  defer_comment?: string | null;
  reschedule_intent?: RescheduleIntent | null;
  created_at?: string;
  updated_at?: string;
  routine_name?: string;
  routine_description?: string | null;
  recovery?: RoutineRecoverySummary | null;
}

export interface RoutineAssignmentActionEvent {
  id: number;
  assignment_id: number;
  event_type: "assigned" | "accepted" | "completed" | "deferred" | "snoozed" | "skipped" | "edited";
  actor_id: string;
  payload: Record<string, unknown>;
  idempotency_key?: string | null;
  created_at: string;
}

export interface CompleteRoutineAssignmentActionRequest {
  action: "complete";
  timezone: string;
  completed_at?: string;
  completion_rate?: number;
  comment?: string;
  idempotency_key?: string;
}

export interface DeferRoutineAssignmentActionRequest {
  action: "defer";
  defer_reason_code: string;
  reschedule_intent: RescheduleIntent;
  comment?: string;
  idempotency_key?: string;
}

export interface SnoozeRoutineAssignmentActionRequest {
  action: "snooze";
  defer_reason_code: string;
  reschedule_intent: RescheduleIntent;
  comment?: string;
  idempotency_key?: string;
}

export interface SkipRoutineAssignmentActionRequest {
  action: "skip";
  skip_reason_code: string;
  comment?: string;
  idempotency_key?: string;
}

export type RoutineAssignmentActionRequest =
  | CompleteRoutineAssignmentActionRequest
  | DeferRoutineAssignmentActionRequest
  | SnoozeRoutineAssignmentActionRequest
  | SkipRoutineAssignmentActionRequest;

export interface RoutineStepCompletion {
  step_id?: number;
  step_name: string;
  state: 'completed' | 'skipped' | 'pending';
  completed_at?: string;
  notes?: string;
}

export interface RoutineLog {
  id: number;
  routine_id: number;
  patient_id: string;
  status: 'completed' | 'deferred' | 'skipped';
  completed_at: string;
  completion_rate: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  steps?: RoutineStepCompletion[];
}

export interface RoutineProgressDay {
  date: string;
  steps_completed: number;
  steps_total: number;
  ratio: number;
  status: 'completed' | 'partial' | 'skipped' | 'missed';
}

export interface RoutineProgressResponse {
  routine_id: number;
  routine_name: string;
  period_days: number;
  completion_by_day: RoutineProgressDay[];
  summary: {
    total_days: number;
    completed_days: number;
    partial_days: number;
    missed_days: number;
    adherence_ratio: number;
  };
}

export interface CadenceRoutineSummary {
  routine_id: number;
  routine_name: string;
  target_completions: number;
  actual_completions: number;
  ratio: number;
  current_streak: number;
  longest_streak: number;
  completion_by_day: RoutineProgressDay[];
}

export interface CadenceResponse {
  period_days: number;
  routines: CadenceRoutineSummary[];
}

export interface CarePlanAction {
  id?: number;
  action: string;
  done: boolean;
}

export interface DailyCarePlan {
  am_actions: CarePlanAction[];
  pm_actions: CarePlanAction[];
  avoid_today: string[];
  watch_for: string[];
  confidence_context: string;
}

// IMP-050: Care Graph types

export interface TriageSummary {
  session_id: string;
  status: string;
  triage_label: string | null;
  confidence_band: string | null;
  priority_score: number | null;
  summary_for_patient: string | null;
  red_flags: string[];
  evidence_completeness: number | null;
  is_preliminary: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventSummary {
  event_type: string;
  timestamp: string;
  session_id: string | null;
  payload: Record<string, unknown>;
}

export interface CareGraphResponse {
  patient_id: string;
  triage_sessions: TriageSummary[];
  events: EventSummary[];
  event_counts: Record<string, number>;
  time_range: Record<string, string | null>;
}

// IMP-239: Daily Summary types

export interface SeverityTrendPoint {
  date: string;
  avg_severity: number;
}

export interface DailySummaryResponse {
  patient_id: string;
  period_days: number;
  adherence_rate: number;
  trend: 'improving' | 'stable' | 'declining';
  symptom_count: number;
  routine_completion_count: number;
  routine_total_count: number;
  severity_trend: SeverityTrendPoint[];
}

// IMP-246: Composite Skin Health Score types

export interface ScoreComponent {
  name: string;
  score: number;
  weight: number;
  weighted_score: number;
  description: string;
}

export interface SkinHealthScoreResponse {
  patient_id: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  components: ScoreComponent[];
  computed_at: string;
  period_days: number;
  disclaimer: string;
}

// WEL-006: Product inventory + ingredient safety

export interface Ingredient {
  id: number;
  name: string;
  inci_name?: string;
  category?: string;
  description?: string;
  risk_level: 'low' | 'moderate' | 'high';
  contraindications: string[];
  sensitivity_triggers: string[];
  pregnancy_safe: boolean;
  notes?: string;
  source?: string;
}

export interface ProductIngredientEntry {
  ingredient_id: number;
  order_in_list?: number;
  concentration_percent?: number;
}

export interface Product {
  id: number;
  brand: string;
  name: string;
  category: string;
  description?: string;
  usage_instructions?: string;
  ingredients: Ingredient[];
  created_by?: string;
  created_at?: string;
}

export type ProductUsageFrequency = 'daily' | 'occasional' | 'as-needed';

export type ProviderProductAnnotationStatus = 'approved' | 'flagged' | 'suggested_alternative';

export interface ProviderProductAnnotationUpdate {
  status: ProviderProductAnnotationStatus;
  reason?: string;
  suggested_alternative?: string;
}

export interface UserProduct {
  id: number;
  patient_id: string;
  product_id: number;
  product?: Product;
  usage_frequency: ProductUsageFrequency;
  started_using_at?: string;
  notes?: string;
  provider_annotation_status?: ProviderProductAnnotationStatus;
  provider_annotation_reason?: string;
  provider_suggested_alternative?: string;
  provider_annotation_by?: string;
  provider_annotation_at?: string;
  created_at?: string;
}

export interface UserProductCreate {
  product_id: number;
  usage_frequency: ProductUsageFrequency;
  started_using_at?: string;
  notes?: string;
}

export interface RoutineStepProduct {
  id: number;
  routine_step_id: number;
  product_id?: number;
  product_name?: string;
  product?: Product;
  notes?: string;
}

export interface IngredientRiskFeedback {
  ingredient_id: number;
  ingredient_name: string;
  severity: 'low' | 'moderate' | 'high';
  rationale: string;
}

export interface SafetyAssessmentRequest {
  product_id: number;
  skin_type?: string;
  allergies: string[];
  conditions: string[];
}

export interface SafetyAssessmentResponse {
  product_id: number;
  product_name: string;
  overall_risk: 'low' | 'moderate' | 'high';
  ingredient_risks: IngredientRiskFeedback[];
  recommendations: string[];
}

export interface SafetyAssessmentResult {
  product_id: number;
  product_name: string;
  overall_risk: 'low' | 'moderate' | 'high';
  ingredient_risks: IngredientRiskFeedback[];
  recommendations: string[];
}

export type ProductCorrelationConfidenceBand = 'low' | 'moderate' | 'high';

export type ProductCorrelationRecommendedAction =
  | 'consider_pause_and_review'
  | 'monitor_and_patch_test'
  | 'no_strong_signal';

export interface ProductCorrelationTopSymptom {
  symptom: string;
  count: number;
  avg_severity: number;
}

export interface ProductCorrelationInsight {
  inventory_item_id: number;
  product_id: number;
  product_name: string;
  product_category: string;
  usage_frequency?: ProductUsageFrequency;
  started_using_at?: string;
  symptom_events_after_start: number;
  avg_symptom_severity: number;
  correlation_score: number;
  confidence_score: number;
  confidence_band: ProductCorrelationConfidenceBand;
  top_symptoms: ProductCorrelationTopSymptom[];
  explainability: string[];
  recommended_action: ProductCorrelationRecommendedAction;
}

export interface ProductCorrelationInsightsResponse {
  patient_id: string;
  generated_at: string;
  insights: ProductCorrelationInsight[];
}

// IMP-243: LLM-powered label extraction

export interface ExtractedIngredient {
  name: string;
  inci_name?: string;
  category?: string;
  concentration_hint?: string;
}

export interface LabelExtractionResult {
  brand?: string;
  product_name?: string;
  category?: string;
  ingredients: ExtractedIngredient[];
  usage_instructions?: string;
  warnings: string[];
  active_compounds: string[];
  confidence: number;
}

export interface InteractionFlag {
  ingredient_name: string;
  severity: 'low' | 'moderate' | 'high';
  reason: string;
  recommendation: string;
}

export interface LabelExtractionResponse {
  extraction: LabelExtractionResult;
  interaction_flags: InteractionFlag[];
  product_id?: number;
}

// IMP-244: Pulse Check-In types

export interface PulseSubmission {
  severity: number;
  note?: string | undefined;
}

export interface PulseResponse {
  pulse_id: string;
  patient_id: string;
  severity: number;
  note?: string;
  created_at: string;
  timeline_event_id?: string;
}

export interface PulseEntry {
  pulse_id: string;
  severity: number;
  note?: string;
  created_at: string;
}
