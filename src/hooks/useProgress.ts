import { useQuery } from "@tanstack/react-query";
import { analyticsApi, PatientProgressResponse } from "../api/analyticsApi";

export const usePatientProgress = (days: number = 30, patientId?: string) => {
  return useQuery<PatientProgressResponse>({
    queryKey: ["patient-progress", days, patientId],
    queryFn: () => analyticsApi.getProgress(days, patientId),
  });
};
