import { useQuery } from "@tanstack/react-query";
import {
  capabilityQueryKey,
  getCapabilities,
  type CapabilityModules,
} from "../api/capabilityGuard";

export function useCapabilities() {
  const query = useQuery({
    queryKey: capabilityQueryKey,
    queryFn: getCapabilities,
    staleTime: 300_000,
  });

  return {
    capabilities: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFeatureEnabled: (feature: keyof CapabilityModules) =>
      query.data?.modules[feature] ?? false,
  };
}
