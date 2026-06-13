# Wren's Adventure

Mobile-first travel companion for a multi-country Asia trip.

Live site: [wrensadventure.com](https://wrensadventure.com)

## What It Does

- Displays live itinerary data from published Google Sheets CSVs
- Organizes the trip by day, leg, category, and calendar
- Shows weather, stays, maps, search, and a phrasebook
- Publishes public trip-photo galleries
- Allows authenticated trip members to upload, edit, and delete photos
- Supports HEIC conversion, compression, metadata-assisted assignment, and duplicate detection
- Works as an installable PWA with an offline app shell

## Stack

- Next.js App Router, React, and TypeScript
- Tailwind CSS and Framer Motion
- Google Sheets published CSVs for itinerary content
- Supabase Postgres and Storage for photos
- Open-Meteo for forecasts and fallback geocoding
- Leaflet and Esri tiles for maps
- Vercel for hosting and production deployments
- Vitest and GitHub Actions for verification

See [Architecture](./docs/ARCHITECTURE.md) for system boundaries and data flow.

## Local Setup

Requirements:

- Node.js 22 or later
- npm
- Access to the four published trip sheets
- Supabase credentials only if working on photos

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Environment Variables

Itinerary data:

- `SHEET_LEGS_URL`
- `SHEET_ACTIVITIES_URL`
- `SHEET_CATEGORIES_URL`
- `SHEET_PHRASES_URL`

Photo feature:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PHOTO_UPLOAD_PASSWORD`
- `PHOTO_SESSION_SECRET`

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `PHOTO_SESSION_SECRET` to browser code.
Photo infrastructure setup is documented in [PHOTO_SETUP.md](./PHOTO_SETUP.md).

## Quality Checks

Run the full release checks before pushing:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Tests currently protect:

- Trip-date and split-day resolution
- Spreadsheet normalization and integrity rules
- Signed photo-session expiry and tamper detection
- Photo-login throttling
- Recoverable photo deletion

GitHub Actions always runs lint, type checking, and tests. It also builds when the four
`SHEET_*_URL` repository secrets are configured. Vercel independently builds every deployment.

## Deployment

GitHub `main` is connected to the production Vercel project. Pushing to `main` triggers a
production deployment to `wrensadventure.com`. Pull requests and non-production branches should
use Vercel preview deployments.

Before pushing to production:

1. Run all four quality checks.
2. Confirm spreadsheet validation succeeds during the build.
3. Use a preview deployment for meaningful UI or mobile changes.
4. Verify the production domain after Vercel finishes deploying.

## Security Model

- Public visitors can view itinerary and published photos without signing in.
- Photo management uses a shared password and a signed, `HttpOnly`, six-month cookie.
- Failed photo-password attempts are throttled in each warm server instance.
- Supabase service-role access is server-only.
- The photo table is inaccessible to anonymous and authenticated Supabase roles.
- Production responses include baseline browser security headers.

The shared-password model is appropriate for this private trip app, but a multi-user product
should use individual accounts, roles, audit logs, and a shared Redis-backed rate limiter.

## Common Change Locations

- Trip data types and CSV ingestion: `src/lib/trip-data.ts`
- Data normalization and validation: `src/lib/trip-data-validation.ts`
- Day and split-day resolution: `src/lib/trip-days.ts`
- Main trip interface: `src/components/trip-app.tsx`
- Photo API routes: `src/app/api/photos/`
- Photo authentication: `src/lib/photo-auth.ts`
- Supabase migration: `supabase/migrations/`
- PWA caching: `public/sw.js`
- Browser security headers: `next.config.ts`
- Dependency-aware health check: `/api/health`

## Known Technical Debt

- `trip-app.tsx` is large and should be decomposed by feature before multiple engineers edit it.
- Login throttling is instance-local rather than shared across all server instances.
- Monitoring and structured error reporting are not yet configured.
- The health endpoint exists, but no external uptime monitor is connected yet.
- Browser-level end-to-end tests are still needed for critical mobile flows.
