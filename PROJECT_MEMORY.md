# Asia Trip App Project Memory

Use this as the pickup memo for a fresh Codex chat.

## Repo

GitHub: https://github.com/slamerow/asia_trip_app

Local project folder:

```text
/Users/eli/Documents/Codex/2026-06-08/i-am-non-technical-and-this/asia_trip_app
```

## Stack

- Next.js
- TypeScript
- Tailwind
- Vercel
- Google Sheets published CSV backend

## Current Status

- GitHub repo and Vercel are connected.
- App deploys successfully to Vercel.
- Google Sheets CSV URLs are saved locally in `.env.local` and in Vercel environment variables.
- App reads live spreadsheet data for Legs, Activities, Categories, and Phrases.
- Current UI direction: rugged luxury / adventure lodge / Barbour / Filson / RRL / brass, moss, parchment, leather warmth.
- Bottom nav is 4 tabs: Legs, Categories, Today, Calendar.
- Today card carousel is centered and card fronts show time, title, and category emoji only.
- Activity detail opens as animated full-screen overlay.
- Calendar currently shows leg bands with translucent colors and split transition days.

## Recent Commits

- `Connect app shell to spreadsheet data`
- `Refine rugged luxury UI direction`
- `Tune adventure lodge UI and carousel`
- `Center today carousel and emphasize home nav`
- `Restore subtle today nav style`
- `Align nav and fix category tile sizing`
- `Show calendar as leg bands`

## Important User Preferences

- User is non-technical and wants plain-English guidance.
- Keep UI clean: no needless explanatory text.
- Weather is v1, Today screen only.
- Weather should use `stay_address` first, then `city + country`.
- No Logistics hub.
- 4-tab nav is correct.
- Category descriptions are okay on Categories screen.
- Native-check phrase warning UI is optional, not required.
- Treat old “Claude Code” references as “Codex.”

## Next Priorities

1. Make sure the latest calendar commit is pushed/deployed if not already.
2. Continue UI polish only where obvious.
3. Build deeper real screens:
   - Leg detail
   - Category detail
   - Calendar month navigation/detail
   - Phrasebook modal
   - Search
   - Weather API
