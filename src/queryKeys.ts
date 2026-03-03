export interface SessionListParams {
  status?: string;
  limit?: number;
  offset?: number;
}

export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  list: (params: SessionListParams) => [...sessionKeys.lists(), params] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
  transcript: (id: string) => [...sessionKeys.detail(id), "transcript"] as const,
  summary: (id: string) => [...sessionKeys.detail(id), "summary"] as const,
  actions: (id: string) => [...sessionKeys.detail(id), "actions"] as const,
  evidenceSnapshot: (id: string) => [...sessionKeys.detail(id), "evidence-snapshot"] as const,
  packet: (id: string) => [...sessionKeys.detail(id), "packet"] as const,
  overrides: (id: string) => [...sessionKeys.detail(id), "overrides"] as const,
};

export const medicalKeys = {
  all: ["medical"] as const,
  symptoms: (params?: Record<string, unknown>) => [...medicalKeys.all, "symptoms", params] as const,
  symptomTypes: () => [...medicalKeys.all, "symptom-types"] as const,
};

export const nudgeKeys = {
  all: ["nudges"] as const,
  session: (sessionId: string) => [...nudgeKeys.all, sessionId] as const,
};

export const healthKeys = {
  all: ["health"] as const,
  check: () => [...healthKeys.all, "check"] as const,
};

export const capabilityKeys = {
  all: ["capabilities"] as const,
};

export const routineKeys = {
  all: ["routines"] as const,
  assignments: (params?: Record<string, unknown>) => [...routineKeys.all, "assignments", params] as const,
};
