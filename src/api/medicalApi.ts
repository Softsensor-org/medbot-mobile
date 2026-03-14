import { BaseApiService } from "./BaseApiService";
import type { ChatResponse } from "../types/ai";
import type {
  CareGraphResponse,
  Symptom,
  SymptomType,
  Routine,
  RoutineAssignment,
  RoutineIntelligenceSummary,
  RoutineAssignmentStatus,
  RoutineAssignmentActionRequest,
  RoutineAssignmentActionEvent,
  RoutineLog,
  RoutineProgressResponse,
  CadenceResponse,
  DailySummaryResponse,
  SkinHealthScoreResponse,
  PulseResponse,
  PulseEntry,
} from "../types/medical";
import type { DailyCarePlanWithAdaptation } from "../types/wellness";

export interface MedicalChatRequest {
  query: string;
  session_id?: string;
  image_base64?: string;
}

class MedicalApiService extends BaseApiService {
  constructor() {
    super("/api/v1");
  }

  async chat(req: MedicalChatRequest): Promise<ChatResponse> {
    return this.post<ChatResponse>("/medical/medical_chat", req);
  }

  async getSymptomTypes(): Promise<SymptomType[]> {
    return this.get<SymptomType[]>("/symptom-types");
  }

  async logSymptom(symptom: Omit<Symptom, "id" | "created_at">): Promise<Symptom> {
    return this.post<Symptom>("/symptoms", symptom);
  }

  async getSymptoms(): Promise<Symptom[]> {
    return this.get<Symptom[]>("/symptoms");
  }

  async getRoutines(): Promise<Routine[]> {
    return this.get<Routine[]>("/routines");
  }

  async getTodayCarePlan(): Promise<DailyCarePlanWithAdaptation> {
    return this.get<DailyCarePlanWithAdaptation>("/care-plan/today");
  }

  async getCareGraph(): Promise<CareGraphResponse> {
    return this.get<CareGraphResponse>("/care-graph");
  }

  async logRoutineCompletion(
    routineId: number,
    status: RoutineLog["status"] = "completed",
  ): Promise<RoutineLog> {
    return this.post<RoutineLog>(`/routines/${routineId}/log`, { status });
  }

  async createRoutine(routine: Omit<Routine, "id">): Promise<Routine> {
    return this.post<Routine>("/routines", routine);
  }

  async getRoutineAssignments(params?: {
    patient_id?: string;
    status?: RoutineAssignmentStatus;
  }): Promise<RoutineAssignment[]> {
    const search = new URLSearchParams();
    if (params?.patient_id) {
      search.set("patient_id", params.patient_id);
    }
    if (params?.status) {
      search.set("status", params.status);
    }
    const query = search.toString();
    const path = query ? `/routines/assignments?${query}` : "/routines/assignments";
    return this.get<RoutineAssignment[]>(path);
  }

  async getRoutineIntelligence(params?: { patient_id?: string }): Promise<RoutineIntelligenceSummary> {
    const search = new URLSearchParams();
    if (params?.patient_id) {
      search.set("patient_id", params.patient_id);
    }
    const query = search.toString();
    const path = query ? `/routines/intelligence?${query}` : "/routines/intelligence";
    return this.get<RoutineIntelligenceSummary>(path);
  }

  async postRoutineAssignmentAction(
    assignmentId: number,
    payload: RoutineAssignmentActionRequest,
  ): Promise<RoutineAssignmentActionEvent> {
    const idempotencyKey = payload.idempotency_key;
    return this.post<RoutineAssignmentActionEvent>(
      `/routines/assignments/${assignmentId}/actions`,
      payload,
      idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined,
    );
  }

  async uploadPhoto(sessionId: string, base64: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    // In React Native, FormData requires a specific object shape for files
    // But since we are passing base64 to the backend, we can just send it as a field 
    // or use the multipart format if the backend expects a file.
    // The backend media.py expects an 'UploadFile'.
    
    // We'll use the 'file' key as expected by FastAPI's File(...)
    const filename = `upload_${Date.now()}.jpg`;
    formData.append('file', {
      uri: base64,
      name: filename,
      type: 'image/jpeg',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return this.post<{ url: string; filename: string }>(
      `/media/upload/${sessionId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  }
  async getDailySummary(days: number = 7, patientId?: string): Promise<DailySummaryResponse> {
    const qp = new URLSearchParams();
    qp.set("days", days.toString());
    if (patientId) qp.set("patient_id", patientId);
    return this.get<DailySummaryResponse>(`/daily-summary?${qp.toString()}`);
  }
  async getSkinScore(days: number = 28): Promise<SkinHealthScoreResponse> {
    const qp = new URLSearchParams();
    qp.set("days", days.toString());
    return this.get<SkinHealthScoreResponse>(`/skin-score?${qp.toString()}`);
  }
  async submitPulse(severity: number, note?: string): Promise<PulseResponse> {
    return this.post<PulseResponse>("/pulse", { severity, note });
  }

  async getRecentPulses(days = 7): Promise<PulseEntry[]> {
    return this.get<PulseEntry[]>(`/pulse?days=${days}`);
  }

  async getRoutineProgress(routineId: number, days = 7): Promise<RoutineProgressResponse> {
    const qp = new URLSearchParams();
    qp.set("days", days.toString());
    return this.get<RoutineProgressResponse>(`/routines/${routineId}/progress?${qp.toString()}`);
  }

  async getRoutineCadence(days = 7): Promise<CadenceResponse> {
    const qp = new URLSearchParams();
    qp.set("days", days.toString());
    return this.get<CadenceResponse>(`/routines/cadence?${qp.toString()}`);
  }
}

export const medicalApi = new MedicalApiService();
