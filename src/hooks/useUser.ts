import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { unwrapApiEnvelope } from "../api/BaseApiService";
import {
  GoalJourney,
  GoalJourneyCreate,
  OnboardingBrief,
  PatientProfile,
  PatientProfilePayload,
  PreferenceProfile,
  RecoveryFollowUpContext,
  RecoveryFollowUpUpsertRequest,
  UserProfile,
} from "../types/user";

export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  patientProfile: () => [...userKeys.all, "patient-profile"] as const,
  brief: () => [...userKeys.all, "brief"] as const,
  preferences: () => [...userKeys.all, "preferences"] as const,
  goals: () => [...userKeys.all, "goals"] as const,
};

export function useUser() {
  const { data: profile, isLoading } = useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const response = await api.get<UserProfile>("/api/v1/me");
      return response.data;
    },
  });

  return {
    user: profile,
    isLoading,
  };
}

export function useOnboardingBrief() {
  return useQuery({
    queryKey: userKeys.brief(),
    queryFn: async () => {
      const response = await api.get("/api/v1/wellness/onboarding/brief");
      return unwrapApiEnvelope<OnboardingBrief>(response);
    },
  });
}

export function useUpdateOnboardingBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<OnboardingBrief>) => {
      const response = await api.post("/api/v1/wellness/onboarding/brief", payload);
      return unwrapApiEnvelope<OnboardingBrief>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.brief() });
    },
  });
}

export function usePatientProfile() {
  return useQuery({
    queryKey: userKeys.patientProfile(),
    queryFn: async () => {
      const response = await api.get("/api/v1/wellness/patient/profile");
      return unwrapApiEnvelope<PatientProfile>(response);
    },
  });
}

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PatientProfilePayload) => {
      const response = await api.put("/api/v1/wellness/patient/profile", payload);
      return unwrapApiEnvelope<PatientProfile>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.patientProfile() });
    },
  });
}

export function useRecoveryFollowUp() {
  return useQuery({
    queryKey: [...userKeys.all, "recovery-follow-up"],
    queryFn: async () => {
      const response = await api.get("/api/v1/wellness/patient/recovery-follow-up");
      return unwrapApiEnvelope<RecoveryFollowUpContext>(response);
    },
  });
}

export function useUpdateRecoveryFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecoveryFollowUpUpsertRequest) => {
      const response = await api.post("/api/v1/wellness/patient/recovery-follow-up", payload);
      return unwrapApiEnvelope<RecoveryFollowUpContext>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.patientProfile() });
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, "recovery-follow-up"] });
    },
  });
}

export function usePreferenceProfile() {
  return useQuery({
    queryKey: userKeys.preferences(),
    queryFn: async () => {
      const response = await api.get("/api/v1/wellness/preferences/profile");
      return unwrapApiEnvelope<PreferenceProfile>(response);
    },
  });
}

export function useUpdatePreferenceProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PreferenceProfile>) => {
      const response = await api.post("/api/v1/wellness/preferences/profile", payload);
      return unwrapApiEnvelope<PreferenceProfile>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.preferences() });
    },
  });
}

export function useGoalJourneys() {
  return useQuery<GoalJourney[]>({
    queryKey: userKeys.goals(),
    queryFn: async () => {
      const response = await api.get("/api/v1/goals/journeys");
      return unwrapApiEnvelope<GoalJourney[]>(response);
    },
  });
}

export function useUpsertGoalJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GoalJourneyCreate) => {
      const response = await api.post("/api/v1/goals/journeys", payload);
      return unwrapApiEnvelope<GoalJourney>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.goals() });
    },
  });
}

export const useCreateGoalJourney = useUpsertGoalJourney;
