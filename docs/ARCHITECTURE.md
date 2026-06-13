# Architecture

## System Overview

Wren's Adventure is a single-trip Next.js application with two data systems:

1. Published Google Sheets CSVs contain itinerary content.
2. Supabase Postgres and Storage contain public trip photos and image files.

Next.js is the application and security boundary. Browser code never receives the Supabase
service-role key or the photo-session signing secret.

## Request Flow

### Itinerary pages

1. A Next.js server component calls `getTripData()`.
2. Four CSV files are fetched in parallel with 60-second revalidation.
3. Rows are normalized into typed legs, activities, categories, and phrases.
4. Human-readable category descriptions are converted to stable category IDs when possible.
5. The complete dataset is validated before rendering.
6. The server resolves the active trip day and initial weather forecast.
7. Typed data is passed to the client-side trip interface.

If validation fails, the request is rejected rather than rendering partially corrupted data. The
application error boundary gives visitors a generic retry screen while server logs retain details.

### Weather

The initial forecast is loaded on the server. Navigating to another date calls `/api/weather`.
Latitude and longitude from the leg are preferred; Open-Meteo geocoding is the fallback.

### Public photos

Server pages query `trip_photos` with the Supabase service-role client and derive public Storage
URLs. The bucket is public, while table access is revoked from normal Supabase client roles.

### Photo management

1. A trip member submits the shared password to `/api/photos/login`.
2. The server compares it using a timing-safe operation.
3. Successful login creates an HMAC-signed, `HttpOnly`, `SameSite=Lax` cookie.
4. Upload, edit, and delete routes require a valid unexpired cookie.
5. Uploads are type- and size-checked, hashed for duplicate detection, stored, then recorded.
6. Deletion removes the public database record before cleaning up Storage, preventing broken
   gallery entries if Storage cleanup fails.

## Core Modules

### `src/lib/trip-data.ts`

Owns CSV fetching and row-to-domain conversion. It should not contain presentation behavior.

### `src/lib/trip-data-validation.ts`

Owns normalization and cross-row integrity rules. This is the closest current analogue to the
validation layer needed by a future itinerary-structuring product.

### `src/lib/trip-days.ts`

Owns date ranges, active-day behavior, and split-location days. Both server and client code use
this shared implementation to avoid divergent itinerary behavior.

### `src/components/trip-app.tsx`

Currently owns most interactive trip UI. It is the largest concentration of technical debt and
should eventually become feature modules for Today, Legs, Categories, Calendar, Search, Maps,
Weather, Stay, and Phrasebook.

### `src/app/api/photos/`

Server-only photo-management boundary. These routes are responsible for authentication,
validation, database changes, Storage changes, and safe failure behavior.

## Data Contracts

Stable identifiers matter more than display labels:

- Legs use `leg_id`.
- Activities use `activity_id` and reference `leg_id`.
- Categories use `category_id`; activity categories should normally store this ID.
- Dates use ISO `YYYY-MM-DD` strings.
- Leg `leave` dates are exclusive.

The validator checks duplicate IDs, references, date validity, leg ranges, numeric constraints,
and coordinate ranges. Add a regression test whenever a new source-data failure is discovered.

## Caching

- Trip CSVs revalidate every 60 seconds.
- Weather forecasts revalidate hourly.
- Geocoding revalidates daily.
- The service worker uses network-first navigation and excludes all `/api/` routes from caching.
- Static assets use cache-first behavior.

Changing service-worker caching behavior requires a cache-version bump in `public/sw.js`.

## Production and Recovery

- GitHub `main` deploys automatically through Vercel.
- `wrensadventure.com` redirects to `www.wrensadventure.com`.
- Supabase migrations are committed under `supabase/migrations/`.
- Spreadsheet data remains an external production dependency.
- Vercel deployment history provides application rollback.
- `/api/health` returns `200` only when current sheet data can be loaded and validated.

There is currently no automated last-known-good spreadsheet snapshot, centralized error tracker,
or orphaned-file cleanup job. These are deliberate next-stage reliability improvements.

## Future Platform Boundary

The future itinerary-structuring product should be a separate multi-trip system. Reuse concepts,
tests, and validation rules from this repository, but do not turn this single-trip app into the
platform by layering tenants and customer workflows directly into it.
