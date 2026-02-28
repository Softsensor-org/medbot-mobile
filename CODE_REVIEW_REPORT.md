# Code Review Report

**Date:** 2026-02-26
**Repository:** `medbot-mobile`
**Branch:** `dev`
**Reviewer:** Claude Opus 4.6 (supersedes prior Gemini CLI review)

## Scope

Full static review of all source files:
- Auth layer (`src/auth/`)
- API layer (`src/api/`)
- SSE streaming (`src/stream/`)
- All Expo Router screens (`app/`)
- Providers, types, schemas, utils, theme, config
- Tests, build config, CI scripts

Validation run:
- `npm test` — pass
- `npm run typecheck` — pass
- `npm run lint` — pass

---

## Findings (32 issues)

### Summary

| Severity | Count |
|----------|-------|
| Critical | 6 |
| High | 10 |
| Medium | 10 |
| Low | 6 |

---

## Critical

### C-1: Auth bypass not gated by `__DEV__` — can activate in production

- **File:** `src/auth/AuthProvider.tsx:20-23`
- **Issue:** `DEV_AUTH_BYPASS` activates whenever Auth0 env vars are missing, contain `"your-tenant"`, or equal `"localhost"`. It is not gated by `__DEV__` or any build profile flag. If env vars are misconfigured in a production build, the app auto-authenticates with a hardcoded fake user and `"dev-bypass-token"`.
- **Impact:** Unauthorized access in production builds with misconfigured environment.
- **Fix:** Gate with `__DEV__`:
  ```ts
  const DEV_AUTH_BYPASS = __DEV__ && (!AUTH0_DOMAIN || AUTH0_DOMAIN.includes("your-tenant") || AUTH0_DOMAIN === "localhost");
  ```

### C-2: No token expiration check or refresh logic

- **File:** `src/api/client.ts:17-25`, `src/auth/AuthProvider.tsx:84-96`
- **Issue:** The request interceptor calls `getAccessToken()` and attaches whatever is stored, even if expired. The refresh token is persisted (line 116) but never used. There is no interceptor or background timer to refresh before expiry.
- **Impact:** After the access token expires (typically 1-24h), every API call returns 401. Users must force-quit and re-login. The stored refresh token is wasted.
- **Fix:** Add a response interceptor that catches 401, attempts refresh via `AuthSession.refreshAsync()` or a `/oauth/token` call with the stored refresh token, and retries the failed request. Clear tokens and redirect to login on refresh failure.

### C-3: `FileReader` API unavailable in React Native

- **File:** `src/utils/imageHelpers.ts:10-21`
- **Issue:** `uriToBase64DataUrl` uses `new FileReader()` which is a Web API. In React Native (Hermes engine), `FileReader` is not available, causing `ReferenceError` at runtime.
- **Impact:** The entire image upload flow crashes on native devices. Photo-based consultations are broken on iOS/Android.
- **Fix:** Use `expo-file-system`:
  ```ts
  import * as FileSystem from 'expo-file-system';
  export async function uriToBase64DataUrl(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return `data:image/jpeg;base64,${base64}`;
  }
  ```

### C-4: Token exchange failure leaves app in permanent loading state

- **File:** `src/auth/AuthProvider.tsx:100-132`
- **Issue:** When `exchangeCodeAsync` throws (line 128-130), the error is logged to console but `isLoading` is never set to `false` and no error state is exposed. The user sees a spinner indefinitely with no retry option.
- **Impact:** Network errors, Auth0 outages, or PKCE mismatches during login leave the app unrecoverable without a force-quit.
- **Fix:** Add `setIsLoading(false)` and an `authError` state in the catch block. Expose the error in context so screens can show retry UI.

### C-5: Empty PKCE code verifier sent on fallback

- **File:** `src/auth/AuthProvider.tsx:109`
- **Issue:** `extraParams: { code_verifier: request?.codeVerifier ?? "" }` sends an empty string if `codeVerifier` is undefined. Auth0 will reject this as an invalid PKCE flow.
- **Impact:** Silent login failure when the auth request object doesn't have a code verifier populated.
- **Fix:** Guard before exchange:
  ```ts
  if (!request?.codeVerifier) {
    console.error("PKCE code verifier missing");
    setIsLoading(false);
    return;
  }
  ```

### C-6: SSE stream `onComplete` fires on error events

- **File:** `src/stream/streamChat.ts:47-49`
- **Issue:** When the server sends `parsed.type === "error"`, both `es.close()` and `onComplete?.()` are called. Consumers cannot distinguish successful completion from errors.
- **Impact:** UI or state machines treat failed streams as successful completions, potentially displaying corrupt or partial AI responses as final.
- **Fix:** Only call `onComplete` for `"complete"`, route `"error"` through `onError`:
  ```ts
  if (parsed.type === "complete") {
    es.close();
    onComplete?.();
  } else if (parsed.type === "error") {
    es.close();
    onError?.(new Error(parsed.message ?? "Stream error from server"));
  }
  ```

---

## High

### H-1: Retry policy can duplicate non-idempotent POST/PATCH requests

- **File:** `src/api/client.ts:27-37`
- **Issue:** `axiosRetry.isNetworkOrIdempotentRequestError` retries network errors for all HTTP methods, including POST and PATCH. Despite the name, network errors on POST trigger retries because the request may not have reached the server.
- **Impact:** Duplicate medical records, double routine completions, or duplicate session creation — especially critical for medical data integrity.
- **Fix:** Restrict retries to GET/HEAD/OPTIONS, or only retry POST when an idempotency key header is present:
  ```ts
  retryCondition: (error) => {
    const method = error.config?.method?.toUpperCase();
    const isSafe = method === "GET" || method === "HEAD" || method === "OPTIONS";
    return (isSafe && axiosRetry.isNetworkOrIdempotentRequestError(error)) || error.response?.status === 429;
  },
  ```

### H-2: Bypass auth token not persisted — API calls fail in dev mode

- **File:** `src/auth/AuthProvider.tsx:78-82`, `src/api/client.ts:17-18`
- **Issue:** In dev bypass mode, the token is set via `setToken("dev-bypass-token")` (React state only). The API client reads from `getAccessToken()` (SecureStore/localStorage), which was never written. All API calls in dev mode omit `Authorization`.
- **Impact:** Dev mode appears authenticated in UI but all API calls fail with 401.
- **Fix:** Call `await setAccessToken("dev-bypass-token")` in the bypass path.

### H-3: `atob` may crash on React Native (Hermes)

- **File:** `src/auth/AuthProvider.tsx:89, 123`
- **Issue:** `atob()` is used to decode JWT payloads. On older Hermes versions or certain RN configurations, `atob` is not available or behaves differently. Additionally, no validation that the token has 3 parts before accessing index `[1]`.
- **Impact:** Runtime crash during token decode on native devices.
- **Fix:** Add a safe base64 decode utility using the `base-64` package or `Buffer`, with structure validation:
  ```ts
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT");
  const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
  ```

### H-4: No 401 response interceptor — no auto-logout on token expiry

- **File:** `src/api/client.ts` (entire file)
- **Issue:** There is no response interceptor. When the backend returns 401 (expired/invalid token), the error propagates as a generic Axios error. The app never clears tokens or redirects to login.
- **Impact:** Users see raw API errors mid-session instead of being gracefully redirected to sign-in. Stale tokens persist in storage.
- **Fix:** Add a response interceptor that catches 401, clears tokens, and emits an event/navigates to login.

### H-5: `BaseApiService.unwrap` returns `undefined` as typed data

- **File:** `src/api/BaseApiService.ts:45-51`
- **Issue:** `body.data` is typed as `T | undefined` (optional in `ApiEnvelope`), but line 50 casts it as `T` unconditionally when `body.success` is true. If the server returns `{ success: true }` without a `data` field, `undefined` is returned as `T`.
- **Impact:** Consumers receive `undefined` where they expect a typed object, causing downstream crashes that are hard to trace.
- **Fix:** Validate data presence:
  ```ts
  if (body.data === undefined || body.data === null) {
    throw new Error("API response success but data is missing");
  }
  return body.data;
  ```

### H-6: SSE parse failure leaves EventSource open

- **File:** `src/stream/streamChat.ts:51-53`
- **Issue:** When `JSON.parse(event.data)` throws, `onError` is called but `es.close()` is not. The EventSource remains open, potentially receiving more unparseable events in a loop.
- **Impact:** Memory leak and repeated error callbacks from a broken stream.
- **Fix:** Close the stream on parse failure:
  ```ts
  catch {
    es.close();
    onError?.(new Error(`Failed to parse SSE event`));
  }
  ```

### H-7: Capability cache never invalidates

- **File:** `src/api/capabilityGuard.ts:13, 20`
- **Issue:** `cachedCapabilities` persists indefinitely after the first fetch. `resetCapabilities()` exists (line 47) but is never called — not on app foreground, not on login, not on any lifecycle event.
- **Impact:** Feature flag changes on the server are invisible until the user force-quits. Features enabled/disabled server-side won't take effect.
- **Fix:** Call `resetCapabilities()` on app foreground (via React Native `AppState` listener) and after login.

### H-8: `localStorage` throws in private browsing (web builds)

- **File:** `src/auth/tokenStorage.ts:14-15, 21-22`
- **Issue:** `localStorage.getItem`/`setItem` is called directly without try-catch. In Safari private mode and some embedded browsers, `localStorage.setItem` throws `QuotaExceededError`.
- **Impact:** Login flow crashes on Expo Web in private/incognito mode.
- **Fix:** Wrap in try-catch with in-memory fallback:
  ```ts
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, value); } catch {
      console.warn("localStorage unavailable, tokens will not persist");
    }
    return;
  }
  ```

### H-9: Routines screen modal traps user on API failure

- **File:** `app/(auth)/(tabs)/routines.tsx:78-83, 94-114`
- **Issue:** `closeCommitBox` returns early when `isSubmitting === true` (line 79-81). If the API call in `handleSubmitDefer` fails after setting `isSubmitting(true)`, the `finally` block resets it (line 113), but there's a brief window where the user can't dismiss. More critically, on Android the hardware back button is bound to `closeCommitBox` which is blocked during submission.
- **Impact:** Brief but noticeable UX freeze on Android during API calls. If the `finally` block doesn't execute (promise rejection in `loadAssignments`), the modal becomes permanently stuck.
- **Fix:** Don't guard modal close on submission state, or ensure the guard only prevents accidental dismissal but allows the hardware back button.

### H-10: `queryClient` not exported — no cache clearing on logout

- **File:** `src/providers/QueryProvider.tsx:4`, `src/auth/AuthProvider.tsx:139-150`
- **Issue:** `queryClient` is module-private and never exported. On logout, `clearTokens()` is called but the TanStack Query cache retains all previous user data. If another user logs in on the same device, cached medical data from the previous user may be visible.
- **Impact:** Privacy violation — sensitive medical data leaks between users on shared devices.
- **Fix:** Export `queryClient` and call `queryClient.clear()` in the logout function.

---

## Medium

### M-1: Auth result types `"error"` and `"cancel"` not handled

- **File:** `src/auth/AuthProvider.tsx:100-132`
- **Issue:** The effect only handles `result?.type === "success"`. Auth result types `"error"`, `"cancel"`, and `"dismiss"` are silently ignored. If a user cancels the login flow, `isLoading` may not be correctly reset.
- **Impact:** Silent failures or stuck loading state after auth cancellation/error.
- **Fix:** Handle all result types:
  ```ts
  if (result?.type === "error") {
    console.error("Auth error:", result.error);
    setIsLoading(false);
  } else if (result?.type === "cancel" || result?.type === "dismiss") {
    setIsLoading(false);
  }
  ```

### M-2: No unmount cleanup in AuthProvider effects

- **File:** `src/auth/AuthProvider.tsx:76-97, 100-132`
- **Issue:** Both effects have async operations (`getAccessToken`, `exchangeCodeAsync`) but no cleanup function. If the component unmounts during these operations, state updates are attempted on unmounted components.
- **Impact:** React warnings, potential memory leaks, and edge-case crashes during rapid auth state changes.
- **Fix:** Add `isMounted` flag pattern in both effects.

### M-3: No SSE stream timeout

- **File:** `src/stream/streamChat.ts:19-64`
- **Issue:** No timeout mechanism exists. If the server stops sending events, the EventSource hangs indefinitely and the cleanup function is never called automatically.
- **Impact:** Memory leak and stuck loading state if the server drops the connection silently.
- **Fix:** Add a timeout (e.g. 60s) that calls `es.close()` and `onError()` if no message arrives.

### M-4: Routines screen uses manual state instead of TanStack Query

- **File:** `app/(auth)/(tabs)/routines.tsx:16-43`
- **Issue:** The screen manages `assignments`, `isLoading`, and `error` manually with `useState` + manual `loadAssignments()`. This bypasses TanStack Query's cache, deduplication, and automatic refetching. After mutations, cache is not invalidated for other consumers.
- **Impact:** No cache sharing with other screens, no background refetching, no optimistic updates. Data inconsistency if routines are displayed elsewhere.
- **Fix:** Migrate to `useQuery` + `useMutation` with `queryClient.invalidateQueries()`.

### M-5: Triage colors duplicated between theme and statusHelpers

- **File:** `src/theme/colors.ts:24-26`, `src/status/statusHelpers.ts:3-7`
- **Issue:** Identical hex values for triage colors defined in two places. Neither imports from the other.
- **Impact:** If a color is updated in one file but not the other, triage indicators will be inconsistent.
- **Fix:** Import from `colors.ts` in `statusHelpers.ts`:
  ```ts
  import { colors } from "../theme/colors";
  const TRIAGE_COLOR_MAP = { self_care: colors.triageSelfCare, ... };
  ```

### M-6: Hardcoded colors throughout routines screen

- **File:** `app/(auth)/(tabs)/routines.tsx:267, 270, 276-277, 300-306, 312, 318, 321, 347, 351, 354`
- **Issue:** At least 12 hardcoded hex values (`#B91C1C`, `#0F766E`, `#B45309`, `#64748B`, `#FFFFFF`, `#E2E8F0`, `#CBD5E1`, `#F8FAFC`, `#CCFBF1`, etc.) instead of using theme colors.
- **Impact:** No dark mode support possible. Theme changes won't propagate. Inconsistent with other screens that use the theme.
- **Fix:** Define semantic colors in `src/theme/colors.ts` and reference them.

### M-7: `MAX_IMAGE_SIZE_MB` defined but never enforced

- **File:** `src/config/constants.ts:12`
- **Issue:** `MAX_IMAGE_SIZE_MB: 10` is declared but no code checks file size before base64 conversion.
- **Impact:** Users can select arbitrarily large images, causing memory exhaustion during base64 encoding, slow uploads, and potential OOM crashes.
- **Fix:** Check file size before conversion using `expo-file-system`:
  ```ts
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && info.size > APP_CONSTANTS.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image exceeds ${APP_CONSTANTS.MAX_IMAGE_SIZE_MB}MB limit`);
  }
  ```

### M-8: `useAuth` provider guard can never fire

- **File:** `src/auth/AuthProvider.tsx:48-55`, `src/auth/useAuth.ts`
- **Issue:** `AuthContext` is initialized with a non-null default object (line 48). The `if (!context)` guard in `useAuth` can never trigger since context will always be the default object.
- **Impact:** Using `useAuth` outside of `AuthProvider` silently returns no-op functions instead of throwing, making misuse hard to detect.
- **Fix:** Initialize with `undefined` and add a runtime guard:
  ```ts
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  // In useAuth:
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  ```

### M-9: `API_BASE_URL` defaults to `localhost` — fails on native devices

- **File:** `src/api/config.ts`
- **Issue:** Default `http://localhost:8000` refers to the device itself on native, not the development machine.
- **Impact:** API calls fail on physical devices and most emulators without explicit env configuration.
- **Fix:** Detect platform and use `10.0.2.2` for Android emulator, or require explicit configuration:
  ```ts
  const DEFAULT_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
  ```

### M-10: Chat screen does not validate `sessionId` route param

- **File:** `app/(auth)/chat/[sessionId].tsx`
- **Issue:** `sessionId` from `useLocalSearchParams` is used directly without null/undefined check. If accessed without a valid param, the screen renders with `"Session: undefined"`.
- **Impact:** Broken screen state with no recovery path.
- **Fix:** Validate and show error UI if missing.

---

## Low

### L-1: Sign-in button not disabled during login

- **File:** `app/sign-in.tsx`
- **Issue:** No loading/disabled state on the sign-in button. Users can tap multiple times, firing multiple auth requests.
- **Impact:** Multiple auth popups or redundant Auth0 calls.
- **Fix:** Add `isLoading` state from `useAuth` and disable the button.

### L-2: Stub screens show developer-facing placeholder text

- **File:** `app/(auth)/consent.tsx`, `app/(auth)/settings.tsx`, `app/(auth)/intake/symptom-log.tsx`, `app/(auth)/intake/pre-visit.tsx`, `app/(auth)/onboarding/skin-brief.tsx`, `app/(auth)/onboarding/preferences.tsx`
- **Issue:** Placeholder text like "will be implemented here" is user-facing but developer-oriented.
- **Impact:** Confusing UX for real users who navigate to these screens.
- **Fix:** Replace with "Coming soon" messaging or hide behind feature flags.

### L-3: Test suite only covers trivial smoke checks

- **File:** `__tests__/smoke.test.ts`
- **Issue:** Tests only verify helper function mappings and type imports. No coverage for: auth bypass behavior, API retry semantics, stream error handling, token storage platform branching, or component rendering.
- **Impact:** Behavioral regressions pass CI undetected.
- **Fix:** Add focused tests for auth, API client, streaming, and critical component paths.

### L-4: Console errors in production builds

- **File:** `src/auth/AuthProvider.tsx:129`, `src/providers/QueryProvider.tsx:7,12`
- **Issue:** `console.error` calls have no production guard. Error messages may contain sensitive auth or API details.
- **Impact:** Information leakage in production logs. Noise in crash reporting tools.
- **Fix:** Use a logger utility gated by `__DEV__`, or integrate a crash reporting service for production.

### L-5: `URLSearchParams` used for query building in medicalApi

- **File:** `src/api/medicalApi.ts`
- **Issue:** `URLSearchParams` is used instead of Axios's built-in `params` config. While functional, this is unnecessary manual work and may have edge-case encoding differences on React Native.
- **Impact:** Minor — potential encoding inconsistencies.
- **Fix:** Use Axios `params` option: `this.get<T>(path, { params })`.

### L-6: Missing `testID` props on interactive elements

- **File:** All screen files
- **Issue:** No `testID` props on buttons, inputs, or interactive elements.
- **Impact:** Automated E2E testing (Detox, Maestro) cannot reliably target elements.
- **Fix:** Add `testID` to all interactive elements.

---

## Ticket Map

All findings are mapped to `coord/TASKS.md` tickets. Items fixed in FIX-027 are marked done.

### FIX-027 — P0 remediation (done)

Resolved: C-1, C-3, C-4, C-5, C-6, H-2, H-6, H-10, M-1, M-2

### FIX-028 — Auth reliability (P0)

| Review ID | Description |
|-----------|-------------|
| C-2 | Implement token refresh logic using stored refresh token |
| H-4 | Add 401 response interceptor — auto-clear tokens and redirect to login |
| H-1 | Restrict axios-retry to idempotent methods only (GET/HEAD/OPTIONS) |
| H-3 | Replace `atob` with cross-platform base64 decode (base-64 or Buffer) |

### FIX-029 — API and stream robustness (P1)

| Review ID | Description |
|-----------|-------------|
| H-5 | Validate `data` presence in `BaseApiService.unwrap` before returning |
| H-7 | Add capability cache invalidation on app foreground via AppState |
| H-8 | Wrap web `localStorage` in try-catch with in-memory fallback |
| H-9 | Fix routines modal dismiss guard — allow Android back button during submit |
| M-3 | Add SSE stream inactivity timeout (60s) |

### FIX-030 — Routines + theme consolidation (P1)

| Review ID | Description |
|-----------|-------------|
| M-4 | Migrate routines screen from manual state to TanStack Query + useMutation |
| M-5 | Consolidate triage colors — statusHelpers imports from theme/colors |
| M-6 | Replace 12+ hardcoded hex values in routines with theme tokens |

### FIX-031 — UX hardening + config safety (P2)

| Review ID | Description |
|-----------|-------------|
| M-7 | Enforce MAX_IMAGE_SIZE_MB before base64 conversion |
| M-8 | Fix useAuth provider guard — init context as undefined, throw on misuse |
| M-9 | Platform-aware API_BASE_URL default (10.0.2.2 for Android emulator) |
| M-10 | Validate sessionId route param in chat screen, show error if missing |

### FIX-032 — Polish and test coverage (P3)

| Review ID | Description |
|-----------|-------------|
| L-1 | Disable sign-in button during login to prevent double-tap |
| L-2 | Replace developer-facing stub text with "Coming soon" or feature-gate |
| L-3 | Add focused unit tests for auth, API client, streaming, token storage |
| L-4 | Gate console.error behind `__DEV__` or integrate crash reporting |
| L-5 | Use Axios `params` config instead of manual URLSearchParams |
| L-6 | Add testID props to all interactive elements for E2E automation |

---

## Residual Risk

- **Auth/token lifecycle** remains the highest risk — no refresh or 401 handling yet (FIX-028 scope).
- **Behavioral regressions** are not caught by the current test suite (FIX-032 scope).
- Items resolved in FIX-027: auth bypass production leak, native image crash, medical data privacy leak, stream error semantics.
