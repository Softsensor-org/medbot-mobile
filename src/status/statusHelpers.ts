import type { TriageLabel } from "../types/ai";

const TRIAGE_COLOR_MAP: Record<TriageLabel, string> = {
  self_care: "#4CAF50",
  clinician_review: "#1976D2",
  urgent: "#D32F2F",
};

const TRIAGE_ICON_MAP: Record<TriageLabel, string> = {
  self_care: "Favorite",
  clinician_review: "Schedule",
  urgent: "Warning",
};

export function colorFor(status: TriageLabel | undefined): string {
  if (!status) return "#9E9E9E";
  return TRIAGE_COLOR_MAP[status] ?? "#9E9E9E";
}

export function iconFor(status: TriageLabel | undefined): string {
  if (!status) return "HelpOutline";
  return TRIAGE_ICON_MAP[status] ?? "HelpOutline";
}
