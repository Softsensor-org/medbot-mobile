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
