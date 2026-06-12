# Photo Feature Setup

This is a one-time deployment task. After setup, trip members upload and manage
photos entirely through the app at `/photos/upload`.

## Required values

- Supabase project reference
- Supabase personal access token for the CLI
- Supabase project URL
- Supabase publishable key
- Supabase service-role key
- Shared trip upload password
- Long random session-signing secret

Never expose the service-role key in browser code or a `NEXT_PUBLIC_*` variable.

## Apply the database and storage migration

```bash
SUPABASE_ACCESS_TOKEN=... npx supabase link --project-ref ...
SUPABASE_ACCESS_TOKEN=... npx supabase db push
```

The migration creates:

- `public.trip_photos`
- the public `trip-photos` image bucket
- duplicate and chronological indexes
- server-only table permissions

## Local environment

Add these values to `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PHOTO_UPLOAD_PASSWORD=...
PHOTO_SESSION_SECRET=...
```

## Vercel environment

Add the same five values to Production, Preview, and Development environments.
Redeploy after saving them.

Members enter the shared trip password once per browser. A signed, `HttpOnly`
cookie keeps uploads unlocked for six months. Followers never sign in.
