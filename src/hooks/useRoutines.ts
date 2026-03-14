import { useQuery } from "@tanstack/react-query";
import { medicalApi } from "../api/medicalApi";
import { routineKeys } from "../queryKeys";
import type { Routine, RoutineProgressResponse, CadenceResponse } from "../types/medical";

export function useRoutines() {
  return useQuery<Routine[]>({
    queryKey: routineKeys.catalog(),
    queryFn: () => medicalApi.getRoutines(),
  });
}

export function useRoutineProgress(routineId: number, days = 7) {
  return useQuery<RoutineProgressResponse>({
    queryKey: routineKeys.progress(routineId, days),
    queryFn: () => medicalApi.getRoutineProgress(routineId, days),
    enabled: routineId > 0,
  });
}

export function useRoutineCadence(days = 7) {
  return useQuery<CadenceResponse>({
    queryKey: routineKeys.cadence(days),
    queryFn: () => medicalApi.getRoutineCadence(days),
  });
}
