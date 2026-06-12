# Photo Feature Setup

This is a one-time deployment task. After setup, trip members upload and manage
photos entirely through the app at `/photos/upload`.

## Required values

- Supabase project reference
- Supabase personal access token for the CLI
- Supabase project URL
- Supabase publishable key
- Supabase service-role key
- Comma-separated trip-member emails

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
PHOTO_MEMBER_EMAILS=member-one@example.com,member-two@example.com
```

## Vercel environment

Add the same four values to Production, Preview, and Development environments.
Redeploy after saving them.

## Supabase Auth URL

The allowed redirect URL must include:

```text
https://YOUR_APP_DOMAIN/auth/confirm
```

For local testing, also allow:

```text
http://localhost:3000/auth/confirm
```

Members sign in once per browser with an emailed magic link. Refresh tokens keep
the session active during normal use. Followers never sign in.
