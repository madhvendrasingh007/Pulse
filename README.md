# PULSE · Personal Life OS

A private, responsive personal dashboard for habits, workouts, nutrition, weight and planning. The app uses a single owner account with no public registration, Auth.js credentials authentication, MongoDB-backed personal-state sync, and a review-before-apply PULSE Coach. It is structured as a Next.js App Router app for GitHub and Netlify.

## Local development

Requirements: Node.js 20.9+ and pnpm (or npm).

1. Open this folder in VS Code.
2. Install dependencies: `pnpm install` (or `npm install`).
3. Copy `.env.example` to `.env.local`.
4. Create a MongoDB Atlas cluster and database user, add your current IP to Atlas Network Access, then set `MONGODB_URI` in `.env.local`. Login rate limiting fails closed unless MongoDB is available.
5. Generate an Auth.js secret and owner password hash; see [Netlify and Atlas setup](docs/DEPLOY_NETLIFY.md).
6. Start the app with `pnpm dev` (or `npm run dev`) and visit http://localhost:3000.

## Current product features

- System-aware Obsidian dark and Porcelain light themes, responsive layouts and mobile bottom navigation.
- Owner-only sign-in, no signup route, short-lived Auth.js JWT sessions, generic failed-login responses, and MongoDB-backed per-IP login throttling.
- Private MongoDB state store for the current owner. Existing browser logs migrate into Atlas at first sign-in; subsequent saves sync across browsers after edits. Revision checks stop stale sessions from silently overwriting newer changes.
- Conversational Coach: it can inspect the small tracking summary sent from the current browser session, make workout/nutrition suggestions when an optional Gemini key is configured, and propose navigation or log changes. Nothing is applied until you explicitly approve it.
- Without Gemini, the Coach still offers the local energy calculator and recognizes a small set of offline commands, such as `open nutrition` and `add habit: stretch for 10 minutes`.
- Daily Mifflin–St Jeor calculations, exercise burn recorded separately from sedentary TDEE, calorie history, food macros, weight logs, editable past entries, habits, planner events and repeatable weekly workouts.
- Server-side Zod validation, API key kept on the server, request bounds, route authentication, and baseline browser security headers.

## Data and production limitations

The private per-owner data document is stored in Atlas, while the browser keeps a local working copy for a quick responsive UI. Atlas handles data at rest; app requests require an owner session and validate the allowed data keys. First signed-in load copies this browser's existing data if the owner's Atlas record is empty. Saves sync after a short debounce. If two browsers edit at the same time, a revision conflict stops later saves and asks for a reload rather than silently replacing newer server data. Reload the app on the second device to pull the latest copy. Back up/export and data deletion tools are still to be added. MongoDB is also used for login-attempt throttling; the login fails closed when Atlas is unavailable.

The site is designed for deployment, but it is not a completed enterprise security certification. Use a unique long owner password, protect all secrets, keep deploy previews isolated, and review dependency/security updates. See the deployment guide for network and data caveats.

## Deployment

Follow [docs/DEPLOY_NETLIFY.md](docs/DEPLOY_NETLIFY.md) for GitHub, Netlify, Atlas, owner credential and optional Gemini setup. Netlify's official Next.js adapter supports the App Router and route handlers without manually pinning the adapter.

## Architecture

```text
src/
  app/                 App Router pages, layout and server route handlers
    api/auth/          Auth.js callbacks
    api/coach/         Authenticated optional AI endpoint
    api/state/         Owner-scoped MongoDB state API
    login/             Owner sign-in page
  components/          Coach approval UI and sign-in form
  lib/auth/            Password verification and login throttling
  lib/db/              Reusable Mongoose connection
  models/              Owner-scoped Mongoose state model
  lib/calculations/    Pure health/energy calculations
  lib/validation/      Zod request/domain schemas
  services/            Domain service boundaries
```

Keep provider keys and database credentials in server environment variables. Do not prefix secrets with `NEXT_PUBLIC_` or commit `.env.local`.
