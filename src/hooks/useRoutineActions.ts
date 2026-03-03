import { useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalApi } from "../api/medicalApi";
import { routineKeys } from "../queryKeys";
import type { RoutineAssignmentActionRequest } from "../types/medical";

export function useCompleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: number; payload: RoutineAssignmentActionRequest }) =>
      medicalApi.postRoutineAssignmentAction(assignmentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: routineKeys.all });
    },
  });
}

export function useDeferAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: number; payload: RoutineAssignmentActionRequest }) =>
      medicalApi.postRoutineAssignmentAction(assignmentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: routineKeys.all });
    },
  });
}
