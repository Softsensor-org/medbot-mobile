import { BaseApiService } from "./BaseApiService";
import type { ConsentStatusDashboard, ExpiredConsentItem, PendingConsentItem } from "../types/consent";

export type ConsentStatus = "accepted" | "declined" | "revoked";

export interface ConsentRecordRequest {
  consent_type_id: string;
  status: ConsentStatus;
  consent_version: string;
  signature?: string;
  source?: string;
  expires_at?: string;
}

export interface ConsentType {
  id: string;
  type: "required" | "optional";
  title: string;
  description: string;
  content_markdown: string;
  version: string;
  requires_signature: boolean;
  active: boolean;
}

export interface UserConsent {
  id: number;
  user_id: string;
  consent_type_id: string;
  status: ConsentStatus;
  consent_version: string;
  acted_at: string;
  expires_at?: string;
  signature?: string;
  source: string;
}

export interface ConsentStatusResponse extends ConsentStatusDashboard {
  pending_required: PendingConsentItem[];
  pending_optional: PendingConsentItem[];
  expired_consents: ExpiredConsentItem[];
}

class ConsentApiService extends BaseApiService {
  constructor() {
    super("/api/v1/consent");
  }

  async getTypes(): Promise<ConsentType[]> {
    return this.get<ConsentType[]>("/types");
  }

  async getUserConsents(): Promise<UserConsent[]> {
    return this.get<UserConsent[]>("/user");
  }

  async getStatus(): Promise<ConsentStatusResponse> {
    return this.get<ConsentStatusResponse>("/status");
  }

  async recordConsent(payload: ConsentRecordRequest): Promise<UserConsent> {
    return this.post<UserConsent>("/record", payload);
  }
}

export const consentApi = new ConsentApiService();
