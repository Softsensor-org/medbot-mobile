import { useQuery } from "@tanstack/react-query";
import { readinessApi, ReadinessSummary } from "../api/readinessApi";

export const readinessKeys = {
  all: ["readiness"] as const,
  summary: (days: number) => [...readinessKeys.all, "summary", days] as const,
};

export const useReadiness = (days: number = 30) => {
  return useQuery<ReadinessSummary>({
    queryKey: readinessKeys.summary(days),
    queryFn: () => readinessApi.getSummary(days),
  });
};
