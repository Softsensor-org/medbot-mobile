import { BaseApiService } from "./BaseApiService";
import type { ChatResponse } from "../types/ai";
import type { Symptom, SymptomType, Routine } from "../types/medical";

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
}

export const medicalApi = new MedicalApiService();
