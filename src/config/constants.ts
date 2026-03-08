/** Feature flags and app constants. */

export const FEATURE_FLAGS = {
  ENABLE_STREAMING: true,
  ENABLE_PHOTO_UPLOAD: true,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_OFFLINE_MODE: false,
  /** IMP-159: Aspirational wave surfaces (goal journeys, trajectory, reveal). */
  ENABLE_ASPIRATIONAL_WAVE: false,
} as const;

export const APP_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_IMAGE_SIZE_MB: 10,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  CHAT_POLLING_INTERVAL_MS: 5000,
} as const;
