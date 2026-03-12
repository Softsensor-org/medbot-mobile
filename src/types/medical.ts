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
  active: boolean;
  steps: RoutineStep[];
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
}

export interface RoutineAssignmentActionEvent {
  id: number;
  assignment_id: number;
  event_type: "assigned" | "accepted" | "completed" | "deferred" | "edited";
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

export type RoutineAssignmentActionRequest =
  | CompleteRoutineAssignmentActionRequest
  | DeferRoutineAssignmentActionRequest;

export interface RoutineLog {
  id: number;
  routine_id: number;
  patient_id: string;
  status: "completed" | "deferred" | "skipped";
  completed_at: string;
  completion_rate: number;
  notes?: string;
  metadata?: Record<string, unknown>;
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
  adaptation?: CarePlanAdaptation;
}

export interface CarePlanAdaptationSignals {
  adherence_rate_7d: number | null;
  logged_events_7d: number;
  deferred_or_skipped_7d: number;
  symptom_avg_severity_7d: number | null;
  symptom_max_severity_7d: number | null;
  symptom_events_7d: number;
  high_symptom_burden: boolean;
  emergency_keywords_present: boolean;
  safety_events_7d: number;
  context_tags: string[];
}

export interface CarePlanAdaptationAdjustment {
  code: string;
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
}

export interface CarePlanAdaptation {
  status: "active" | "suppressed" | "fallback";
  suppressed: boolean;
  reason_codes: string[];
  confidence_band: "High" | "Moderate" | "Low";
  signals: CarePlanAdaptationSignals;
  next_day_adjustments: CarePlanAdaptationAdjustment[];
  fallback_message?: string | null;
}

// --- Pre-visit Check-in (MB-709) ---

export type AppointmentType = "clinic" | "telemed" | "urgent_care";

export interface SessionAppointment {
  session_id: string;
  user_id: string;
  appointment_type: AppointmentType;
  appointment_datetime: string;
  clinic_location: string;
  created_at: string;
  updated_at: string;
}

export interface PreVisitQuestion {
  id: number;
  question_set_id: number;
  question_number: number;
  text: string;
  evidence_slot_name: string | null;
  required: boolean;
  metadata: Record<string, unknown> | null;
}

export interface PreVisitReadiness {
  session_id: string;
  readiness_pct: number;
  has_appointment: boolean;
  appointment_type?: AppointmentType;
  required_total: number;
  required_answered: number;
  missing_required: {
    question_id: number;
    text: string;
    evidence_slot: string | null;
  }[];
  answers_provided: number[];
}

export type IntakeModeValue = "symptom_logging" | "triage_submission";

export interface IntakeMode {
  session_id: string;
  mode: IntakeModeValue;
  updated_at: string;
}

// IMP-244: Pulse Check-In types

export interface PulseSubmission {
  severity: number;
  note?: string;
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

// --- WEL-006: Product inventory + ingredient safety ---

export interface Ingredient {
  id: number;
  name: string;
  inci_name?: string;
  category?: string;
  description?: string;
  risk_level: "low" | "moderate" | "high";
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

export interface UserProduct {
  id: number;
  patient_id: string;
  product_id: number;
  product?: Product;
  usage_frequency: "daily" | "occasional" | "as-needed";
  started_using_at?: string;
  notes?: string;
  created_at?: string;
}

export interface UserProductCreate {
  product_id: number;
  usage_frequency: "daily" | "occasional" | "as-needed";
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
  severity: "low" | "moderate" | "high";
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
  overall_risk: "low" | "moderate" | "high";
  ingredient_risks: IngredientRiskFeedback[];
  recommendations: string[];
}
