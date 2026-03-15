import { useQuery } from "@tanstack/react-query";
import { readinessApi, ReadinessSummary, PrepChecklistResponse } from "../api/readinessApi";

export const readinessKeys = {
  all: ["readiness"] as const,
  summary: (days: number) => [...readinessKeys.all, "summary", days] as const,
  prepChecklist: (days: number) => [...readinessKeys.all, "prep-checklist", days] as const,
};

export const useReadiness = (days: number = 30) => {
  return useQuery<ReadinessSummary>({
    queryKey: readinessKeys.summary(days),
    queryFn: () => readinessApi.getSummary(days),
  });
};

export const usePrepChecklist = (days: number = 30) => {
  return useQuery<PrepChecklistResponse>({
    queryKey: readinessKeys.prepChecklist(days),
    queryFn: () => readinessApi.getPrepChecklist(days),
  });
};
