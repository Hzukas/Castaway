# Castaway — Project Context

Collaborative group trip-planning web app. Tagline: **"Find your island. Together. / Dream it. Pitch it. Go."**
Families/friend groups create a group, set a shared "target" (budget, dates, vibes), members pitch dream
destinations, everyone votes/ranks live, group converges on a winner. Monetization later via affiliate
links (Booking/Airbnb/Skyscanner); no ads until real traffic.

Live at **https://castaway-silk.vercel.app** · GitHub: **Hzukas/Castaway** (main branch)

## Who you're working with
Harrison — first-time coder, Windows machine, VS Code. **Terminal must be Command Prompt, not
PowerShell** (PowerShell blocks npm scripts on his setup). He understands product/design decisions well
but relies on you for all implementation. Explain what you're doing in plain terms, not jargon-heavy.

## Working conventions
- Batch related changes together rather than one file at a time — he'd rather review a coherent chunk.
- Any SQL/schema change: give him the SQL to paste into the Supabase SQL Editor **before** you touch
  files that depend on it, and wait for confirmation it's been run (you don't have DB access yourself).
- After file changes, run `git add . && git commit -m "..." && git push` yourself once he confirms —
  Vercel auto-deploys from main. **Env var changes require a manual Redeploy in Vercel** (not automatic).
- When showing progress, only show the current phase, not the full roadmap every time.
- Don't be afraid of complex/multi-step solutions — he prefers the right solution over the simplest one.

## Stack & accounts
- **Next.js 16** (App Router, JavaScript — not TypeScript, inline styles, no Tailwind), on **Vercel**
  (project lives under his "RankAnything" Vercel team; domain castaway-silk.vercel.app)
- **Supabase** project "Castaway" — id `oqpjbagyimvddegoguhk`, region us-west-2.
  ⚠️ His org also has an unrelated **"RankAnything"** Supabase project (a different site of his) —
  double-check you/he are in the Castaway project before changing any Supabase settings.
- **Legacy Supabase API keys required** (anon + service_role JWTs starting `eyJ`). New-style
  publishable/secret keys previously caused "Forbidden use of secret API key in browser" — do not
  switch to new-style keys.

## Env vars (`.env.local` and Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://oqpjbagyimvddegoguhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<legacy anon JWT>
SUPABASE_SERVICE_ROLE_KEY=<legacy service_role JWT>
ADMIN_PASSWORD=<his chosen password>
```

## Database schema (RLS disabled on all tables — known security debt, fix before real launch)
- **groups**: `name` text (⚠️ likely the accidental PK), `invite_code` text, `created_by` uuid,
  `target_budget` numeric, `target_days` int, `travel_window` text, `passport_ok` bool (legacy),
  `vibe_tags` text[], `travel_type` text default 'no_preference' (domestic_only / international_ok /
  no_preference), `id` uuid default gen_random_uuid() (added later, NOT the PK — known debt, fix eventually)
- **group_members**: id uuid, group_id uuid, user_id uuid, email text, home_airport text,
  max_flight_hours numeric, joined_at timestamp
- **profiles**: id uuid, `user_id uuid UNIQUE`, display_name, home_airport, passport_holder bool,
  max_flight_hours numeric, budget_min, budget_max, budget_flexible bool, vibe_tags text[],
  climate_prefs text[], travel_pace text ('relaxed'/'moderate'/'packed'), avatar_url text, created_at
- **Storage**: public bucket `avatars`, insert/update/select policy. Upload supports file-pick AND
  Ctrl+V paste.
- Auth: email/password with email confirmation.

## Routes/files built (working unless noted below)
- `/` landing, `/auth`, `/onboarding` (vacation alter-ego name), `/dashboard`, `/profile`, `/group/[id]`,
  `/join/[code]`, `/admin` (double-locked: hardcoded email harrisonzukas@gmail.com + ADMIN_PASSWORD)
- `lib/supabase.js` (anon client), `lib/supabaseAdmin.js` (server-only service role client)
- `lib/authGuard.js` — `getSafeUser()` (8s timeout, auto-signs-out corrupted sessions) and
  `safeRedirect()` (circuit breaker: max 3 redirects/8s/tab). All auth-gated pages use these.

## Design language
Deep navy `#0d1f2d` bg, gold `#FFD166` primary, greens `#5DCAA5`/`#1D9E75` success/tags, blue `#378ADD`,
red-ish `#F0997B` errors, dark cards `rgba(255,255,255,0.04–0.07)` with 0.5px borders, inline styles
everywhere. Planned: topo-map texture (group page), flight-path grid (landing), 12 destination-biome
pitch backgrounds (Mayan temples, cartoon beach, Roman city, deep ocean, alpine, cherry blossom,
northern lights, desert, savanna, fjords, carnival, space) as SVG art layers.

## Product decisions locked in
- Seasonal average prices, never live scraping; link out to Google Flights. Data sourced via AI
  batch-seed of 200+ destinations, Numbeo (costs), Open-Meteo (climate), Unsplash/Pexels + Google
  Places (photos/POIs).
- Pitch cards: human-written trip name/quote/"why I love it" (never auto-generated) + automated data
  layer (photos, POIs, match %, weather).
- Weather & Conditions section per pitch: honest intel (humidity, mosquitoes, hurricane season,
  jellyfish, packing list) — signature feature.
- Voting: yes/maybe/veto + separate "I'm in" commitment w/ progress bar; comments per pitch.
- Ranking: drag-order per member, group chart = avg rank (lower better), live, always visible on group
  page left column (same pattern as his other project, rankanything.org).
- Per-member hard flight limits; group effective max = most restrictive member.
- Backlog (low priority): multi-destination trips, event/festival timing awareness.

## NEXT FEATURE — Alter Egos (schema restructure, next major build)
One account (email login) → multiple alter egos. Account-level: passport (home airport is an open
question — leaning account-level, confirm with Harrison). Per-ego: display name, budget, vibe prefs,
climate prefs, pace (avatar per-ego probably — confirm). First signup = exactly one ego (current
onboarding flow). Only prompted to pick/create an ego when joining/creating a **second** group. Hard
rule: one ego per user per group; same email's egos can span different groups. Add 'skiing/snowboarding'
to vibe options. Suggested schema: new `personalities` table (id, user_id, display_name, avatar_url,
budget_min/max/flexible, vibe_tags, climate_prefs, travel_pace); `profiles` slims to account-level facts;
`group_members` gains `personality_id`.

## Known issues / TODO (in order)
1. ✅ Supabase Auth URL config fixed on the correct (Castaway) project.
2. ✅ `/admin` crash fixed — confirmed working live (loads users/groups tables, no crash).
3. `groups` table PK is wrong (likely `name`) — `id` should become the real PK eventually.
4. RLS disabled everywhere — needs real policies before public launch.
5. Build Alter Egos (spec above) — next up.

## Roadmap status
- ✅ Phase 1 — setup/landing
- ✅ Phase 2 — auth/profiles/groups/invites/admin (cleaning up issues #2-4 above)
- ⏭️ Phase 3 — Destination data: Supabase destinations schema, AI batch-seed 200+ destinations,
  search/filter page, Numbeo + Open-Meteo integration
- Phase 4 — Pitch pages (Unsplash/Places, themes, weather section, pitch creation)
- Phase 5 — Live features (votes, drag-rank + live chart, comments, Supabase Realtime)
- Phase 6 — Motion + polish (animations, transitions, confetti)

## People/context
Harrison (Hzukas; harrisonzukas@gmail.com = hardcoded admin email). Test users: brother
(rjzukas@gmail.com, "Rayzor"), mom & girlfriend. Existing test groups: "Zukauskis" (code IE5YMQ),
"Zukas/Momberg Family Vacation!!!" (A7G760).
