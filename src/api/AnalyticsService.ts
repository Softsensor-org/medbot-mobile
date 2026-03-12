export type AnalyticsEvent = 
  | 'autopilot_step_done'
  | 'autopilot_step_snooze'
  | 'autopilot_step_skip'
  | 'weekly_reveal_viewed'
  | 'weekly_reveal_cta_clicked'
  | 'weekly_reveal_share_clicked'
  | 'safety_gate_triggered'
  | 'safety_gate_cta_clicked';

class AnalyticsService {
  /**
   * Track an event with optional properties.
   * All data must be non-PHI.
   */
  track(_event: AnalyticsEvent, _properties?: Record<string, any>) {
    // We can also send to a generic backend endpoint if available
    // api.post('/analytics/event', { event, properties, timestamp: new Date().toISOString() }).catch(() => {});
  }

  identify(_userId: string) {}
}

export const analytics = new AnalyticsService();
