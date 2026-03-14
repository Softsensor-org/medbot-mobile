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

export interface PendingConsentItem {
  id: string;
  title: string;
  version: string;
}

export interface ExpiredConsentItem {
  id: string;
  title: string;
  expired_at: string;
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
  total_consents: number;
  required_consents: number;
  optional_consents: number;
  requires_action: boolean;
  accepted_required: number;
  accepted_optional: number;
  pending_required: PendingConsentItem[];
  pending_optional: PendingConsentItem[];
  expired_consents: ExpiredConsentItem[];
}

export interface ShareConsentValidation {
  valid: boolean;
  missing: string[];
  expired: string[];
  version_mismatch: string[];
}
