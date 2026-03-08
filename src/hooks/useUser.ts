import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { OnboardingBrief, PreferenceProfile, GoalJourney, GoalJourneyCreate, UserProfile } from "../types/user";

export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
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
      const response = await api.get("/onboarding/brief");
      return response.data.data as OnboardingBrief;
    },
  });
}

export function useUpdateOnboardingBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<OnboardingBrief>) => {
      const response = await api.post("/onboarding/brief", payload);
      return response.data.data as OnboardingBrief;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.brief() });
    },
  });
}

export function usePreferenceProfile() {
  return useQuery({
    queryKey: userKeys.preferences(),
    queryFn: async () => {
      const response = await api.get("/preferences/profile");
      return response.data.data as PreferenceProfile;
    },
  });
}

export function useUpdatePreferenceProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PreferenceProfile>) => {
      const response = await api.post("/preferences/profile", payload);
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
      const response = await api.get("/goals/journeys");
      return response.data.data;
    },
  });
}

export function useUpsertGoalJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GoalJourneyCreate) => {
      const response = await api.post("/goals/journeys", payload);
      return response.data.data as GoalJourney;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.goals() });
    },
  });
}

export const useCreateGoalJourney = useUpsertGoalJourney;
