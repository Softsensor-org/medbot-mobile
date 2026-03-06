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
