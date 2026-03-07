import type { AdherenceTrendPoint } from "../api/analyticsApi";

export interface StreakRescueState {
  missedDays: number;
  rescueEligible: boolean;
  supportiveMessage: string;
  rescueTarget: string;
}

export function deriveStreakRescueState(adherence: AdherenceTrendPoint[]): StreakRescueState {
  const recent = [...adherence].slice(-7);
  const missedDays = recent.filter((point) => point.rate < 0.5).length;
  const rescueEligible = missedDays > 0;

  if (!rescueEligible) {
    return {
      missedDays: 0,
      rescueEligible: false,
      supportiveMessage: "You are maintaining consistent care momentum.",
      rescueTarget: "Keep following your current routine.",
    };
  }

  return {
    missedDays,
    rescueEligible: true,
    supportiveMessage:
      "Missed days happen. Use a quick rescue step today to stay on track without pressure.",
    rescueTarget: "Complete one simple care action today.",
  };
}
