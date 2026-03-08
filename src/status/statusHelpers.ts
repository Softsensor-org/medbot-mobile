import type { TriageLabel } from "../types/ai";
import { colors } from "../theme/colors";

const TRIAGE_COLOR_MAP: Record<TriageLabel, string> = {
  self_care: colors.triageSelfCare,
  clinician_review: colors.triageClinician,
  urgent: colors.triageUrgent,
};

const TRIAGE_ICON_MAP: Record<TriageLabel, string> = {
  self_care: "Favorite",
  clinician_review: "Schedule",
  urgent: "Warning",
};

/** IMP-161: Session status colors for backend-aligned SessionMeta. */
const SESSION_STATUS_COLOR_MAP: Record<string, string> = {
  new: colors.triageSelfCare,
  waiting: colors.triageClinician,
  assigned: colors.triageClinician,
  closed: colors.textDisabled,
};

export function colorFor(status: TriageLabel | string | undefined): string {
  if (!status) return colors.textDisabled;
  return TRIAGE_COLOR_MAP[status as TriageLabel]
    ?? SESSION_STATUS_COLOR_MAP[status]
    ?? colors.textDisabled;
}

export function iconFor(status: TriageLabel | undefined): string {
  if (!status) return "HelpOutline";
  return TRIAGE_ICON_MAP[status] ?? "HelpOutline";
}
