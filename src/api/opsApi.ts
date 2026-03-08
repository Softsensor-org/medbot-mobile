/**
 * IMP-207: Ops KPI API service.
 *
 * Canonical endpoint paths:
 * - `/api/v1/ops/kpi` — operational KPI snapshot (provider-only)
 * - `/api/v1/ops/aspirational/kpis` — aspirational wave KPIs (provider-only, feature-flagged)
 * - `/api/v1/ops/aspirational/flag` — aspirational feature flag status
 */

import { BaseApiService } from "./BaseApiService";

export interface KpiSnapshot {
  snapshot: Record<string, unknown>;
  alerts: Record<string, unknown>[];
}

export interface AspirationalKpiSnapshot {
  snapshot: Record<string, unknown>;
  decision: Record<string, unknown>;
  thresholds: Record<string, unknown>;
  feature_flag: boolean;
}

export interface AspirationalFlagStatus {
  enabled: boolean;
  env_var: string;
}

class OpsApiService extends BaseApiService {
  constructor() {
    super("/api/v1/ops");
  }

  /** Operational KPI snapshot. Provider role required. */
  async getKpiSnapshot(): Promise<KpiSnapshot> {
    return this.get<KpiSnapshot>("/kpi");
  }

  /** Aspirational wave KPIs. Provider role + feature flag required. */
  async getAspirationalKpis(days: number = 30): Promise<AspirationalKpiSnapshot> {
    return this.get<AspirationalKpiSnapshot>("/aspirational/kpis", {
      params: { days },
    });
  }

  /** Aspirational feature flag status. Auth required. */
  async getAspirationalFlag(): Promise<AspirationalFlagStatus> {
    return this.get<AspirationalFlagStatus>("/aspirational/flag");
  }
}

export const opsApi = new OpsApiService();
