# CLAUDE.md — medbot-mobile

## Project Overview

React Native (Expo SDK 54) patient mobile app for Medbot dermatology assistant.
Separate repo from web frontend (`Softsensor-org/medical-chatbot-frontend`).

## Commands

```bash
# Development
npx expo start              # Start Expo dev server
npx expo start --android    # Start on Android
npx expo start --ios        # Start on iOS

# Quality
npm run typecheck           # TypeScript check (tsc --noEmit)
npm run lint                # ESLint
npm run lint:fix            # ESLint with auto-fix
npm run format              # Prettier format
npm run format:check        # Prettier check

# Testing
npm test                    # Run Jest tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Build (EAS)
npx eas build --platform ios --profile development
npx eas build --platform android --profile development
```

## Architecture

- **Expo SDK 54** with Expo Router (file-based routing)
- **TypeScript** (strict mode)
- **TanStack Query** for API state management
- **Auth0** via expo-auth-session (PKCE flow)
- **expo-secure-store** for encrypted token persistence
- **react-native-sse** for SSE streaming (not Web Streams API)
- **Axios** with Bearer auth + `X-App-Version` / `X-App-Platform` headers

### Directory Structure

```
app/                  # Expo Router screens (file-based routing)
  _layout.tsx         # Root layout (providers)
  sign-in.tsx         # Login
  (auth)/             # Auth-guarded group
    (tabs)/           # Bottom tab navigator (Daily, Care, Routines, Profile)
    chat/             # Chat screen
    intake/           # Intake mode selector, symptom log, pre-visit
    onboarding/       # Skin brief, preferences
    consent.tsx
    settings.tsx
src/
  api/                # Axios client, BaseApiService, endpoint services
  auth/               # AuthProvider, useAuth, tokenStorage
  components/         # UI components by domain
  hooks/              # TanStack Query hooks
  providers/          # QueryProvider, ToastProvider
  types/              # Shared types (synced from web frontend)
  schemas/            # Zod schemas (synced from web frontend)
  stream/             # SSE streaming via react-native-sse
  theme/              # Colors, typography, spacing
  utils/              # Platform headers, image helpers
  config/             # Feature flags, constants
  status/             # Triage status helpers
```

### Type Sync

Types in `src/types/` are copied from web frontend `packages/shared/src/types/`.
CI drift check validates sync on every PR via `scripts/run-gate.sh`. To sync manually:

```bash
# From project root
make sync-types

# From medbot-mobile root
bash scripts/sync-types.sh
```

## Key Differences from Web Frontend

| Concern | Web | Mobile |
|---------|-----|--------|
| Auth | Auth0 React SDK + cookies | expo-auth-session + expo-secure-store |
| SSE | Web Streams API (`getReader()`) | react-native-sse (EventSource) |
| Config | `import.meta.env.VITE_*` | `Constants.expoConfig?.extra` / `EXPO_PUBLIC_*` |
| Headers | N/A | `X-App-Version`, `X-App-Platform` on every request |
| Routing | React Router | Expo Router (file-based) |
| UI | Material-UI | React Native StyleSheet |

## Environment Variables

See `.env.example`. All use `EXPO_PUBLIC_` prefix for client access.

## Conventions

- TypeScript strict mode required
- TanStack Query for all API calls (no raw fetch/axios in components)
- Follow existing component patterns
- Never commit credentials or `.env` files
- Git commit messages: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- Do NOT include AI co-author attributions in commits
- PR-only merges; never commit directly to `main` or `dev`

## Coordination

This repo follows the multi-agent coordination protocol in `medbot/coord/`.
Mobile tickets use `MOB-*` prefix with Repo tag `M`.
