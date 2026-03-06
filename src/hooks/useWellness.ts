import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wellnessApi } from "../api/wellnessApi";
import { wellnessKeys } from "../queryKeys";
import type { IntakeModeValue, AppointmentType } from "../types/medical";

export function useIntakeMode(sessionId: string) {
  return useQuery({
    queryKey: wellnessKeys.intakeMode(sessionId),
    queryFn: () => wellnessApi.getIntakeMode(sessionId),
    enabled: !!sessionId,
  });
}

export function useSetIntakeMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, mode }: { sessionId: string; mode: IntakeModeValue }) =>
      wellnessApi.setIntakeMode(sessionId, mode),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: wellnessKeys.intakeMode(sessionId) });
    },
  });
}

export function usePrevisitQuestions(appointmentType: string) {
  return useQuery({
    queryKey: wellnessKeys.previsitQuestions(appointmentType),
    queryFn: () => wellnessApi.getPrevisitQuestions(appointmentType),
    enabled: !!appointmentType,
  });
}

export function usePrevisitReadiness(sessionId: string) {
  return useQuery({
    queryKey: wellnessKeys.previsitReadiness(sessionId),
    queryFn: () => wellnessApi.getPrevisitReadiness(sessionId),
    enabled: !!sessionId,
  });
}

export function useSubmitPrevisitAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, questionId, answer }: { sessionId: string; questionId: number; answer: unknown }) =>
      wellnessApi.submitPrevisitAnswer(sessionId, questionId, answer),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: wellnessKeys.previsitReadiness(sessionId) });
    },
  });
}

export function useAppointmentContext(sessionId: string) {
  return useQuery({
    queryKey: wellnessKeys.appointment(sessionId),
    queryFn: () => wellnessApi.getAppointmentContext(sessionId),
    enabled: !!sessionId,
  });
}

export function useSetAppointmentContext() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      appointment,
    }: {
      sessionId: string;
      appointment: {
        appointment_type: AppointmentType;
        appointment_datetime: string;
        clinic_location: string;
      };
    }) => wellnessApi.setAppointmentContext(sessionId, appointment),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: wellnessKeys.appointment(sessionId) });
      queryClient.invalidateQueries({ queryKey: wellnessKeys.previsitReadiness(sessionId) });
    },
  });
}
