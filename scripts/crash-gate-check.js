/* eslint-disable no-undef */
/**
 * crash-gate-check.js
 * Simulates querying an observability provider (e.g., Sentry, Bugsnag)
 * to verify that the current 'preview' build does not have critical crash regressions
 * before promoting to 'production'.
 */

async function checkCrashRate(version) {
  console.log(`--- Crash Gate Check for version ${version} ---`);
  
  // Simulation: In a real CI, this would fetch from Sentry API
  // Example: GET /api/0/projects/{org}/{project}/stats/
  
  const mockErrorRate = 0.02; // 0.02%
  const threshold = 0.5; // 0.5% max allowed
  
  console.log(`[INFO] Current Error Rate: ${mockErrorRate}%`);
  console.log(`[INFO] Allowed Threshold: ${threshold}%`);
  
  if (mockErrorRate > threshold) {
    console.error(`[FAIL] Error rate ${mockErrorRate}% exceeds threshold! Blocking release.`);
    process.exit(1);
  }
  
  console.log(`[PASS] Error rate is healthy.`);
  console.log(`--- Crash Gate Complete: SUCCESS ---`);
}

const appVersion = process.env.APP_VERSION || 'unknown';
checkCrashRate(appVersion).catch(err => {
  console.error(err);
  process.exit(1);
});
