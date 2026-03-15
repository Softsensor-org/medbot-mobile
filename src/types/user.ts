export interface OnboardingBrief {
  id?: number;
  user_id?: string;
  version?: number;
  goals: string[];
  baseline?: string | null;
  climate_lifestyle?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constraints: Record<string, any>;
  updated_at?: string;
}

export type SkinType = "dry" | "oily" | "combination" | "sensitive" | "normal";
export type SkinSensitivity = "low" | "moderate" | "high";
export type BudgetPreference = "low" | "medium" | "high";
export type RoutineDepthPreference = "minimal" | "moderate" | "intensive";
export type TreatmentModalityPreference = "clinical-only" | "home-only" | "hybrid";
export type TexturePreference = "gel" | "cream" | "serum" | "balm" | "mist";
export type ReminderCadence = "gentle" | "standard" | "structured";
export type ShoppingPreference = "otc" | "mixed" | "clinical";
export type MembershipStatus = "inactive" | "trial" | "active" | "paused" | "ended";
export type ProgramStatus = "not_started" | "active" | "paused" | "completed";
export type TreatmentPlanStatus = "inactive" | "active" | "maintenance" | "on-hold" | "completed";
export type ProgramContextSource = "manual" | "goal-journey-derived";
export type JourneyStage = "prep" | "treatment" | "recovery" | "maintenance" | "next_step";
export type JourneyStageSource = "manual" | "derived";
export type ProgramTemplateId =
  | "acne_clearance"
  | "acne_maintenance"
  | "chronic_barrier_repair"
  | "chronic_rosacea_control"
  | "chronic_melasma_control";
export type ProgramTemplateTrack = "acne" | "chronic_skin";

export interface ProgramTemplateStageDefinition {
  stage: JourneyStage;
  title: string;
  objective: string;
  routine_focus: string;
  follow_up_cadence_days: number;
  routine_recovery_hint: string;
  escalation_signals: string[];
}

export interface ProgramTemplateRoutineRecovery {
  defer_enabled: boolean;
  snooze_enabled: boolean;
  skip_enabled: boolean;
  max_consecutive_skips: number;
  recovery_window_days: number;
  resume_guidance: string;
}

export interface ProgramTemplateSnapshot {
  template_id: ProgramTemplateId;
  label: string;
  track: ProgramTemplateTrack;
  summary: string;
  default_follow_up_cadence_days: number;
  escalation_criteria: string[];
  routine_recovery: ProgramTemplateRoutineRecovery;
  stages: ProgramTemplateStageDefinition[];
}

export interface MembershipContext {
  status: MembershipStatus;
  name?: string | null;
  cadence_label?: string | null;
  renewal_at?: string | null;
}

export interface ProgramTrackContext {
  status: ProgramStatus;
  name?: string | null;
  focus?: string | null;
  summary?: string | null;
  target_date?: string | null;
  source: ProgramContextSource;
  template?: ProgramTemplateSnapshot | null;
}

export interface TreatmentPlanContext {
  status: TreatmentPlanStatus;
  name?: string | null;
  summary?: string | null;
  next_review_at?: string | null;
}

export interface JourneyStageContext {
  stage: JourneyStage;
  source: JourneyStageSource;
  updated_at?: string | null;
}

export interface ProgramContextSnapshot {
  id?: number;
  version: number;
  updated_at?: string;
  membership: MembershipContext;
  program: ProgramTrackContext;
  treatment_plan: TreatmentPlanContext;
  journey_stage: JourneyStageContext;
}

export interface PatientProfilePayload {
  preferred_name?: string | null;
  pronouns?: string | null;
  skin_type?: SkinType | null;
  skin_sensitivity?: SkinSensitivity | null;
  allergies: string[];
  conditions: string[];
  notes_for_care_team?: string | null;
}

export interface PatientProfile extends PatientProfilePayload {
  id?: number;
  user_id?: string;
  version?: number;
  updated_at?: string;
  program_context?: ProgramContextSnapshot;
}

export interface EssentialPreferences {
  goals: string[];
  budget: BudgetPreference;
  routine_depth: RoutineDepthPreference;
  treatment_modality_comfort: TreatmentModalityPreference;
  avoid_list: string[];
  texture_preferences: TexturePreference[];
  fragrance_free_only: boolean;
  reminder_cadence: ReminderCadence;
  shopping_preference: ShoppingPreference;
}

export interface PreferenceProfile {
  id?: number;
  user_id?: string;
  version?: number;
  essential: EssentialPreferences;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  progressive: Record<string, any>;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  role: "patient" | "provider";
}

export interface GoalJourney {
  id: number;
  patient_id: string;
  target_outcome: string;
  target_date: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constraints: Record<string, any>;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
}

export interface GoalJourneyCreate {
  target_outcome: string;
  target_date: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constraints?: Record<string, any>;
}
