import { useMemo } from 'react';
import { usePatientProgress } from './useProgress';
import { ProgressPhoto } from '../api/analyticsApi';

export interface WeeklyInsight {
  status: 'improving' | 'stable' | 'regressing' | 'low_data';
  confidence: number; // 0 to 1
  summary: string;
  recommendation: string;
  cta: { label: string; route: string };
  comparison: {
    before?: ProgressPhoto;
    after?: ProgressPhoto;
  };
}

export function useWeeklyReveal() {
  const { data, isLoading } = usePatientProgress(7);

  const insight = useMemo<WeeklyInsight | null>(() => {
    if (!data) return null;

    const { symptoms, adherence, photos } = data;
    // 1. Data Density (Confidence)
    // 7 days * (1 routine + 1 symptom) = 14 events for max confidence
    const eventCount = symptoms.length + adherence.length;
    const confidence = Math.min(eventCount / 10, 1);

    // 2. Trend Analysis
    let status: WeeklyInsight['status'] = 'stable';
    if (symptoms.length >= 2) {
      const latest = symptoms[symptoms.length - 1].severity;
      const first = symptoms[0].severity;
      if (latest < first - 0.5) status = 'improving';
      else if (latest > first + 0.5) status = 'regressing';
    }

    if (confidence < 0.4) status = 'low_data';

    // 3. Comparison Photos
    const before = photos.length >= 2 ? photos[photos.length - 1] : undefined;
    const after = photos.length > 0 ? photos[0] : undefined;

    // 4. Content Generation (Mocked logic for now)
    let summary = "Your skin condition has remained stable over the last week.";
    let recommendation = "Consistency is key. Try to hit 100% adherence to see faster results.";
    let cta = { label: "Log Today's Progress", route: "/(auth)/intake/symptom-log" };

    if (status === 'improving') {
      summary = "Great news! We're seeing a clear downward trend in your symptom severity.";
      recommendation = "The current routine is working. Stay the course for another week.";
      cta = { label: "Continue Routine", route: "/(auth)/(tabs)/routines" };
    } else if (status === 'regressing') {
      summary = "We've noticed a slight increase in symptom severity this week.";
      recommendation = "This can be normal, but let's monitor closely. Consider a check-in chat.";
      cta = { label: "Chat with Assistant", route: "/(auth)/intake" }; // Or specific session
    } else if (status === 'low_data') {
      summary = "We don't have enough data to confirm a trend this week.";
      recommendation = "Try to log your symptoms daily so we can give you better insights.";
      cta = { label: "Complete Daily Loop", route: "/(auth)/(tabs)/" };
    }

    return {
      status,
      confidence,
      summary,
      recommendation,
      cta,
      comparison: { before, after }
    };
  }, [data]);

  return {
    insight,
    isLoading
  };
}
