import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export interface Intervention {
  id: number;
  patient_id: string;
  name: string;
  type: "medication" | "supplement" | "nutrition";
  status: "active" | "discontinued";
  dosage?: string;
  frequency?: string;
  started_at?: string;
  discontinued_at?: string;
  notes?: string;
}

export interface HandoffSummary {
  patient_id: string;
  active_interventions: Intervention[];
  recent_symptoms: any[];
  habit_performance: any[];
  generated_at: string;
}

export function useInterventionLedger() {
  return useQuery<Intervention[]>({
    queryKey: ["interventions-ledger"],
    queryFn: async () => {
      const response = await api.get("/interventions/ledger");
      return response.data.data;
    },
  });
}

export function useAddIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Intervention>) => {
      const response = await api.post("/interventions/ledger", payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions-ledger"] });
    },
  });
}

export function useHandoffSummary() {
  return useQuery<HandoffSummary>({
    queryKey: ["handoff-summary"],
    queryFn: async () => {
      const response = await api.get("/interventions/handoff-summary");
      return response.data.data;
    },
  });
}
