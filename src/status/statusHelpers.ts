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

export function colorFor(status: TriageLabel | undefined): string {
  if (!status) return colors.textDisabled;
  return TRIAGE_COLOR_MAP[status] ?? colors.textDisabled;
}

export function iconFor(status: TriageLabel | undefined): string {
  if (!status) return "HelpOutline";
  return TRIAGE_ICON_MAP[status] ?? "HelpOutline";
}
