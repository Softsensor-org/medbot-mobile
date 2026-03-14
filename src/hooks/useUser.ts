import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { OnboardingBrief, PatientProfile, PatientProfilePayload, PreferenceProfile, GoalJourney, GoalJourneyCreate, UserProfile } from "../types/user";

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
      const response = await api.get("/user/profile");
      return response.data.data as UserProfile;
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
      return response.data.data as OnboardingBrief;
    },
  });
}

export function useUpdateOnboardingBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<OnboardingBrief>) => {
      const response = await api.post("/api/v1/wellness/onboarding/brief", payload);
      return response.data.data as OnboardingBrief;
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
      return response.data.data as PatientProfile;
    },
  });
}

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PatientProfilePayload) => {
      const response = await api.put("/api/v1/wellness/patient/profile", payload);
      return response.data.data as PatientProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.patientProfile() });
    },
  });
}

export function usePreferenceProfile() {
  return useQuery({
    queryKey: userKeys.preferences(),
    queryFn: async () => {
      const response = await api.get("/api/v1/wellness/preferences/profile");
      return response.data.data as PreferenceProfile;
    },
  });
}

export function useUpdatePreferenceProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PreferenceProfile>) => {
      const response = await api.post("/api/v1/wellness/preferences/profile", payload);
      return response.data.data as PreferenceProfile;
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
      return response.data.data;
    },
  });
}

export function useUpsertGoalJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GoalJourneyCreate) => {
      const response = await api.post("/api/v1/goals/journeys", payload);
      return response.data.data as GoalJourney;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.goals() });
    },
  });
}

export const useCreateGoalJourney = useUpsertGoalJourney;
