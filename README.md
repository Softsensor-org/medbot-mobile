# Medbot Mobile

Expo / React Native patient mobile app for the Medbot workspace.

## Stack

- Expo SDK 54
- React Native 0.81
- Expo Router
- TanStack Query
- Auth0 via `expo-auth-session`
- Jest + React Native Testing Library

## Commands

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
npm test
npm run test:coverage
```

## Environment

Copy `.env.example` and configure:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your-client-id
EXPO_PUBLIC_AUTH0_AUDIENCE=https://your-api-audience
EAS_PROJECT_ID=your-eas-project-id
```

## Structure

- `app/` — Expo Router screens
- `src/api/` — API client/services
- `src/auth/` — auth provider and token storage
- `src/hooks/` — query/data hooks
- `src/types/` and `src/schemas/` — synced/shared types
- `src/stream/` — SSE handling
- `src/theme/` — colors, spacing, typography

## Notes

- Shared type sync flows from `../frontend/packages/shared/src/types/` into `src/types/`.
- Mobile backlog and placeholder-shell follow-up work is tracked in `../coord/TASKS.md`.
- Governance and workflow rules live in `../coord/GOVERNANCE.md`.

## Related Docs

- `CLAUDE.md` — repo-specific agent guidance
- `../coord/TASKS.md`
- `../coord/INTEGRATION.md`
- `../msrv/API_CONTRACT.md`
