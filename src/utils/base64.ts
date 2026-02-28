/**
 * Cross-platform base64 decode safe for React Native / Hermes.
 * Handles base64url encoding (used by JWTs) by converting to standard base64.
 * Uses globalThis.atob when available, with a pure-JS fallback.
 */
export function decodeBase64(input: string): string {
  // Convert base64url to standard base64
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad === 2) base64 += "==";
  else if (pad === 3) base64 += "=";

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(base64);
  }

  // Pure-JS fallback for environments without atob
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  let i = 0;
  while (i < base64.length) {
    const enc1 = chars.indexOf(base64.charAt(i++));
    const enc2 = chars.indexOf(base64.charAt(i++));
    const enc3 = chars.indexOf(base64.charAt(i++));
    const enc4 = chars.indexOf(base64.charAt(i++));

    output += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
    if (enc3 !== 64) output += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
    if (enc4 !== 64) output += String.fromCharCode(((enc3 & 3) << 6) | enc4);
  }

  return output;
}
