export interface OnboardingBrief {
  id?: number;
  user_id?: string;
  version?: number;
  goals: string[];
  baseline?: string | null;
  climate_lifestyle?: string | null;
  constraints: Record<string, any>;
  updated_at?: string;
}

export type BudgetPreference = "low" | "medium" | "high";
export type RoutineDepthPreference = "minimal" | "moderate" | "intensive";
export type TreatmentModalityPreference = "clinical-only" | "home-only" | "hybrid";

export interface EssentialPreferences {
  goals: string[];
  budget: BudgetPreference;
  routine_depth: RoutineDepthPreference;
  treatment_modality_comfort: TreatmentModalityPreference;
  avoid_list: string[];
}

export interface PreferenceProfile {
  id?: number;
  user_id?: string;
  version?: number;
  essential: EssentialPreferences;
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
  constraints: Record<string, any>;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
}

export interface GoalJourneyCreate {
  target_outcome: string;
  target_date: string;
  constraints?: Record<string, any>;
}
