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
  patient_id?: string;
  assigned_by?: string;
  assigned_at?: string;
  recurrence?: Record<string, unknown>; // Scheduling blob
  day_part?: 'morning' | 'afternoon' | 'evening';
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
  status: 'completed' | 'deferred' | 'skipped';
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

export interface UserProduct {
  id: number;
  patient_id: string;
  product_id: number;
  product?: Product;
  usage_frequency: 'daily' | 'occasional' | 'as-needed';
  started_using_at?: string;
  notes?: string;
  created_at?: string;
}

export interface UserProductCreate {
  product_id: number;
  usage_frequency: 'daily' | 'occasional' | 'as-needed';
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
