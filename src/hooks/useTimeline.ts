import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export interface TimelineEvent {
  id: string;
  type: "symptom" | "routine" | "photo";
  timestamp: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  next_cursor: string | null;
  has_more: boolean;
  total_count: number;
}

export const useTimeline = (limit: number = 50, patientId?: string) => {
  return useQuery<TimelineResponse>({
    queryKey: ["timeline", limit, patientId],
    queryFn: async () => {
      const params: Record<string, any> = { limit };
      if (patientId) params.patient_id = patientId;
      const response = await api.get("/timeline", { params });
      return response.data.data as TimelineResponse;
    },
  });
};
