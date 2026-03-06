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

export interface PatientProgressResponse {
  patient_id: string;
  period_days: number;
  summary: PatientProgressSummary;
  symptoms: SymptomTrendPoint[];
  adherence: AdherenceTrendPoint[];
  photos: ProgressPhoto[];
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
