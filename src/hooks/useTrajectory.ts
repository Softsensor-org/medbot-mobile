import { useMemo } from 'react';
import { useGoalJourneys } from './useUser';
import { usePatientProgress } from './useProgress';
import { differenceInDays, parseISO, startOfToday } from 'date-fns';

export interface TrajectoryData {
  goalOutcome: string;
  daysRemaining: number;
  progressPercent: number; // 0 to 100
  confidenceScore: number; // 0 to 1
  nextMilestone: string;
  velocity: 'steady' | 'accelerating' | 'slowing';
}

export function useTrajectory() {
  const { data: journeys = [] } = useGoalJourneys();
  const { data: progress } = usePatientProgress(30);

  const trajectory = useMemo<TrajectoryData | null>(() => {
    if (journeys.length === 0 || !progress) return null;

    const journey = journeys[0];
    const startDate = parseISO(journey.created_at);
    const targetDate = parseISO(journey.target_date);
    const today = startOfToday();

    const totalDays = differenceInDays(targetDate, startDate);
    const elapsedDays = differenceInDays(today, startDate);
    const daysRemaining = differenceInDays(targetDate, today);

    // 1. Time-based progress
    let timeProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
    timeProgress = Math.min(Math.max(timeProgress, 0), 100);

    // 2. Performance-based progress (Adherence impacts 'velocity')
    const adherence = progress.summary.adherence_rate;
    const progressPercent = Math.min(timeProgress * (0.5 + adherence * 0.5), 100);

    // 3. Confidence based on adherence and photo frequency
    const photoFrequency = progress.summary.photo_count / 4; // Expecting ~1 photo per week
    const confidenceScore = (adherence * 0.7) + (Math.min(photoFrequency, 1) * 0.3);

    // 4. Milestone logic
    let nextMilestone = "25% Achievement";
    if (progressPercent >= 75) nextMilestone = "Outcome Goal";
    else if (progressPercent >= 50) nextMilestone = "75% Achievement";
    else if (progressPercent >= 25) nextMilestone = "50% Achievement";

    return {
      goalOutcome: journey.target_outcome,
      daysRemaining: Math.max(daysRemaining, 0),
      progressPercent: Math.round(progressPercent),
      confidenceScore,
      nextMilestone,
      velocity: adherence > 0.8 ? 'accelerating' : adherence > 0.5 ? 'steady' : 'slowing'
    };
  }, [journeys, progress]);

  return {
    trajectory,
    isLoading: !progress
  };
}
