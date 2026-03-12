import { BaseApiService } from "./BaseApiService";
import type {
  PreVisitQuestion,
  PreVisitReadiness,
  IntakeMode,
  IntakeModeValue,
  SessionAppointment,
  AppointmentType,
} from "../types/wellness";

class WellnessApiService extends BaseApiService {
  constructor() {
    super("/api/v1/wellness");
  }

  async getPrevisitQuestions(appointmentType: string, includeOptional = false): Promise<PreVisitQuestion[]> {
    const params = { appointment_type: appointmentType, include_optional: includeOptional };
    return this.get<PreVisitQuestion[]>("/previsit/questions", { params });
  }

  async submitPrevisitAnswer(sessionId: string, questionId: number, answer: unknown): Promise<{ id: number }> {
    return this.post<{ id: number }>(`/sessions/${sessionId}/previsit/answers`, {
      question_id: questionId,
      answer,
    });
  }

  async getPrevisitReadiness(sessionId: string): Promise<PreVisitReadiness> {
    return this.get<PreVisitReadiness>(`/sessions/${sessionId}/previsit/readiness`);
  }

  async getIntakeMode(sessionId: string): Promise<IntakeMode> {
    return this.get<IntakeMode>(`/intake/mode/${sessionId}`);
  }

  async setIntakeMode(sessionId: string, mode: IntakeModeValue): Promise<IntakeMode> {
    return this.put<IntakeMode>(`/intake/mode/${sessionId}`, { mode });
  }

  async getAppointmentContext(sessionId: string): Promise<SessionAppointment> {
    return this.get<SessionAppointment>(`/sessions/${sessionId}/appointment`);
  }

  async setAppointmentContext(
    sessionId: string,
    appointment: {
      appointment_type: AppointmentType;
      appointment_datetime: string;
      clinic_location: string;
    }
  ): Promise<SessionAppointment> {
    return this.put<SessionAppointment>(`/sessions/${sessionId}/appointment`, appointment);
  }
}

export const wellnessApi = new WellnessApiService();
