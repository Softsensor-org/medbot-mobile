export interface ConsentType {
  id: string;
  title: string;
  description: string;
  type: "required" | "optional";
  requires_signature: boolean;
  content_markdown: string;
  version: string;
  active: boolean;
}

export type ConsentStatus = "accepted" | "declined" | "revoked";

export interface ConsentRecord {
  id: number;
  user_id: string;
  consent_type_id: string;
  status: ConsentStatus;
  consent_version: string;
  acted_at: string;
  expires_at?: string | null;
  source: string;
}

export interface ConsentRecordRequest {
  consent_type_id: string;
  status: ConsentStatus;
  consent_version: string;
  signature?: string;
  source?: string;
  expires_at?: string;
}

export interface ConsentStatusItem {
  id: string;
  consent_type_id: string;
  title: string;
  type: "required" | "optional";
  status: ConsentStatus | "pending";
  version: string;
  consent_version?: string;
  current_version: string;
  version_match: boolean;
  expired: boolean;
}

export interface ConsentStatusDashboard {
  requires_action: boolean;
  pending_required: ConsentStatusItem[];
  pending_optional: ConsentStatusItem[];
  expired_consents: ConsentStatusItem[];
  accepted_required: ConsentStatusItem[];
  accepted_optional: ConsentStatusItem[];
}

export interface ShareConsentValidation {
  valid: boolean;
  missing: string[];
  expired: string[];
  version_mismatch: string[];
}
