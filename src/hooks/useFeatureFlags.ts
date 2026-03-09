import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export interface FeatureFlags {
  autopilot_enabled: boolean;
  weekly_reveal_enabled: boolean;
  premium_design_v2: boolean;
  safety_gate_strict: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  autopilot_enabled: true,
  weekly_reveal_enabled: true,
  premium_design_v2: true,
  safety_gate_strict: false,
};

export function useFeatureFlags() {
  return useQuery<FeatureFlags>({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/v1/capabilities");
        const data = response.data.data;
        const modules = data.modules || {};
        
        return { 
          ...DEFAULT_FLAGS,
          // Map capabilities to flags if present, otherwise defaults
          autopilot_enabled: modules.usage !== undefined ? modules.usage : DEFAULT_FLAGS.autopilot_enabled,
          weekly_reveal_enabled: modules.knowledge_base !== undefined ? modules.knowledge_base : DEFAULT_FLAGS.weekly_reveal_enabled,
        };
      } catch {
        return DEFAULT_FLAGS;
      }
    },
    staleTime: 600_000, // 10 minutes
  });
}
