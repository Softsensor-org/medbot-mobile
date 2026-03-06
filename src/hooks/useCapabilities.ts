import { useQuery } from "@tanstack/react-query";
import {
  capabilityQueryOptions,
  type AppCapabilities,
  type CapabilityModules,
} from "../api/capabilityGuard";

export function useCapabilities() {
  const query = useQuery<AppCapabilities>({
    ...capabilityQueryOptions,
  });

  return {
    capabilities: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFeatureEnabled: (feature: keyof CapabilityModules) =>
      query.data?.modules[feature] ?? false,
  };
}
