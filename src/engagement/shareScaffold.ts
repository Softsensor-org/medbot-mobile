import type { PatientProgressResponse } from "../api/analyticsApi";

export interface PhiSafeShareSummary {
  title: string;
  periodDays: number;
  adherencePercent: number;
  symptomCheckins: number;
  photoEntries: number;
  activeRoutines: number;
  trendNote: string;
  generatedAt: string;
}

function buildTrendNote(adherencePercent: number, symptomCheckins: number): string {
  if (adherencePercent >= 80 && symptomCheckins <= 5) {
    return "Stable progress trend this period.";
  }
  if (adherencePercent >= 60) {
    return "Steady adherence with room to improve consistency.";
  }
  return "Recovery focus: prioritize one small action per day.";
}

export function buildPhiSafeShareSummary(data: PatientProgressResponse): PhiSafeShareSummary {
  const adherencePercent = Math.round(data.summary.adherence_rate * 100);
  return {
    title: "Skincare Progress Snapshot",
    periodDays: data.period_days,
    adherencePercent,
    symptomCheckins: data.summary.symptom_count,
    photoEntries: data.summary.photo_count,
    activeRoutines: data.summary.active_routines,
    trendNote: buildTrendNote(adherencePercent, data.summary.symptom_count),
    generatedAt: new Date().toISOString(),
  };
}

export function buildPhiSafeShareMessage(summary: PhiSafeShareSummary): string {
  return [
    summary.title,
    `Period: ${summary.periodDays} days`,
    `Adherence: ${summary.adherencePercent}%`,
    `Symptom check-ins: ${summary.symptomCheckins}`,
    `Photo entries: ${summary.photoEntries}`,
    `Active routines: ${summary.activeRoutines}`,
    `Trend: ${summary.trendNote}`,
    "No personal identifiers or clinical narrative included.",
  ].join("\n");
}
