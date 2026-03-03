import { useQuery } from "@tanstack/react-query";
import { medicalApi } from "../api/medicalApi";
import { routineKeys } from "../queryKeys";
import type { RoutineAssignment, RoutineAssignmentStatus } from "../types/medical";

interface UseRoutineAssignmentsParams {
  patient_id?: string;
  status?: RoutineAssignmentStatus;
}

export function useRoutineAssignments(params?: UseRoutineAssignmentsParams) {
  return useQuery<RoutineAssignment[]>({
    queryKey: routineKeys.assignments(params as Record<string, unknown> | undefined),
    queryFn: () => medicalApi.getRoutineAssignments(params),
  });
}
