import React from "react";
import {
  getEngagementSettings,
  updateEngagementSettings,
  subscribeEngagementSettings,
} from "../engagement/engagementSettings";

export function useEngagementSettings() {
  const [settings, setSettings] = React.useState(() => getEngagementSettings());

  React.useEffect(() => {
    return subscribeEngagementSettings((next) => setSettings(next));
  }, []);

  const setHapticsEnabled = React.useCallback((enabled: boolean) => {
    updateEngagementSettings({ hapticsEnabled: enabled });
  }, []);

  return {
    ...settings,
    setHapticsEnabled,
  };
}
