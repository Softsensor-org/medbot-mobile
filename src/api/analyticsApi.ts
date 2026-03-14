import { BaseApiService } from "./BaseApiService";

export interface SymptomTrendPoint {
  date: string;
  severity: number;
  count: number;
}

export interface AdherenceTrendPoint {
  date: string;
  rate: number;
}

export interface ProgressPhoto {
  id: string;
  timestamp: string;
  url: string;
  thumbnail_url?: string;
  session_id?: string;
}

export interface PatientProgressSummary {
  symptom_count: number;
  adherence_rate: number;
  photo_count: number;
  active_routines: number;
}

export interface RitualHistoryDay {
  date: string;
  completed_count: number;
  avg_completion_rate: number;
  routine_names: string[];
}

export interface RitualHistorySummary {
  total_logs: number;
  active_days: number;
  current_streak: number;
  best_streak: number;
  recent_days: RitualHistoryDay[];
}

export type InsightModuleTone = "positive" | "neutral" | "attention";

export interface InsightModule {
  key: string;
  title: string;
  value: string;
  detail: string;
  tone: InsightModuleTone;
}

export interface PatientProgressResponse {
  patient_id: string;
  period_days: number;
  summary: PatientProgressSummary;
  symptoms: SymptomTrendPoint[];
  adherence: AdherenceTrendPoint[];
  photos: ProgressPhoto[];
  ritual_history: RitualHistorySummary;
  insight_modules: InsightModule[];
}

class AnalyticsApiService extends BaseApiService {
  constructor() {
    super("/api/v1/patient");
  }

  async getProgress(days: number = 30, patientId?: string): Promise<PatientProgressResponse> {
    const params: Record<string, any> = { days }; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (patientId) params.patient_id = patientId;
    return this.get<PatientProgressResponse>("/progress", { params });
  }
}

export const analyticsApi = new AnalyticsApiService();
