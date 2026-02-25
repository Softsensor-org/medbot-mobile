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
