import { useQuery } from "@tanstack/react-query";
import { medicalApi } from "../api/medicalApi";
import { routineKeys } from "../queryKeys";
import type { Routine } from "../types/medical";

export function useRoutines() {
  return useQuery<Routine[]>({
    queryKey: routineKeys.catalog(),
    queryFn: () => medicalApi.getRoutines(),
  });
}
