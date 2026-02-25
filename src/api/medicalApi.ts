import { BaseApiService } from "./BaseApiService";
import type { ChatResponse } from "../types/ai";
import type {
  Symptom,
  SymptomType,
  Routine,
  RoutineAssignment,
  RoutineAssignmentStatus,
  RoutineAssignmentActionRequest,
  RoutineAssignmentActionEvent,
} from "../types/medical";

export interface MedicalChatRequest {
  message: string;
  session_id?: string;
  image_base64?: string;
}

class MedicalApiService extends BaseApiService {
  constructor() {
    super("/api/v1");
  }

  async chat(req: MedicalChatRequest): Promise<ChatResponse> {
    return this.post<ChatResponse>("/medical_chat", req);
  }

  async getSymptomTypes(): Promise<SymptomType[]> {
    return this.get<SymptomType[]>("/symptoms/types");
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
}

export const medicalApi = new MedicalApiService();
