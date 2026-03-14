import { useQuery } from "@tanstack/react-query";

import { medicalApi } from "../api/medicalApi";
import { routineKeys } from "../queryKeys";
import type { RoutineIntelligenceSummary } from "../types/medical";

interface UseRoutineIntelligenceParams {
  patient_id?: string;
}

export function useRoutineIntelligence(params?: UseRoutineIntelligenceParams) {
  return useQuery<RoutineIntelligenceSummary>({
    queryKey: [...routineKeys.intelligence(), params ?? {}],
    queryFn: () => medicalApi.getRoutineIntelligence(params),
  });
}
