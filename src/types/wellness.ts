import type { DailyCarePlan } from "./medical";

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

export type DailyCarePlanWithAdaptation = DailyCarePlan & {
  adaptation?: CarePlanAdaptation;
};

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

export interface SessionSummaryData {
  topics_discussed: string[];
  data_captured: string[];
  recommended_next_step: string | null;
  turn_count: number;
  triage_label: string | null;
}
