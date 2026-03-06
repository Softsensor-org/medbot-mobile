import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalApi } from "../api/medicalApi";
import { medicalKeys } from "../queryKeys";
import type { Symptom } from "../types/medical";

export function useSymptomTypes() {
  return useQuery({
    queryKey: medicalKeys.symptomTypes(),
    queryFn: () => medicalApi.getSymptomTypes(),
  });
}

export function useLogSymptom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (symptom: Omit<Symptom, "id" | "created_at">) => medicalApi.logSymptom(symptom),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalKeys.symptoms() });
    },
  });
}

export function useSymptoms() {
  return useQuery({
    queryKey: medicalKeys.symptoms(),
    queryFn: () => medicalApi.getSymptoms(),
  });
}
