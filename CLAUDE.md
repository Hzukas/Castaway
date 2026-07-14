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
UNSPLASH_ACCESS_KEY=<his Unsplash dev app access key>   # local-only, used by scripts/seed-destinations.js, not needed on Vercel yet
```

## Database schema (RLS disabled on all tables — known security debt, fix before real launch)
- **groups**: `name` text (⚠️ likely the accidental PK), `invite_code` text, `created_by` uuid,
  `target_budget` numeric, `target_days` int, `travel_window` text, `passport_ok` bool (legacy),
  `vibe_tags` text[], `travel_type` text default 'no_preference' (domestic_only / international_ok /
  no_preference), `id` uuid default gen_random_uuid() (added later, NOT the PK — known debt, fix eventually)
- **group_members**: id uuid, group_id uuid, user_id uuid, email text, home_airport text,
  max_flight_hours numeric, joined_at timestamp, `personality_id` uuid (which alter ego represents this
  user in this group — not locked to one group, same ego can be reused across groups)
- **profiles** (account-level facts only): id uuid, `user_id uuid UNIQUE`, home_airport, passport_holder
  bool, avatar_url text (default/account photo), created_at. ⚠️ Still has old vestigial columns
  (display_name, budget_min/max/flexible, vibe_tags, climate_prefs, travel_pace, max_flight_hours) —
  unused by app code since Alter Egos shipped, kept for now, drop in a future cleanup migration.
- **personalities** (alter egos — one account can have several): id uuid, user_id uuid, display_name,
  avatar_url text (nullable — falls back to profiles.avatar_url in the UI when null), budget_min,
  budget_max, budget_flexible bool, vibe_tags text[], climate_prefs text[], travel_pace text
  ('relaxed'/'moderate'/'packed'), max_flight_hours numeric, created_at. First signup = exactly one ego
  auto-created in onboarding; only prompted to pick/create one when joining/creating a **second** group
  (see [components/EgoPicker.js](components/EgoPicker.js)).
- **destinations** (Phase 3 pilot, 40 seeded): id uuid, slug text unique, name, country, region, tagline,
  description, vibe_tags text[] / climate_tags text[] (reuse the exact same taxonomy as
  `lib/tripOptions.js` so matching against personas later is a plain array-overlap check),
  passport_required bool, best_months int[], typical_trip_length_days int, cost_per_person_min/max
  numeric (**AI-estimated**, not Numbeo — see Product decisions), climate_stats jsonb (**real** data,
  pulled from Open-Meteo's historical archive for the most recent full year), honest_intel text[]
  (the "Weather & Conditions" signature-feature bullets), lat/lng numeric, primary_photo_url,
  photo_urls text[] (**real** photos from Unsplash), created_at.
- **Storage**: public bucket `avatars`, insert/update/select policy. Upload supports file-pick AND
  Ctrl+V paste.
- Auth: email/password with email confirmation.

## Routes/files built (working unless noted below)
- `/` landing, `/auth`, `/onboarding` (creates account + first alter ego), `/dashboard` ("Your
  vacations"), `/profile` (Account facts + Alter Egos management), `/group/[id]` ("vacation" in UI copy),
  `/join/[code]`, `/destinations` (Phase 3 search/filter catalog, standalone — not yet linked to a
  specific vacation, that's Phase 4), `/admin` (double-locked: hardcoded email
  harrisonzukas@gmail.com + ADMIN_PASSWORD)
- `lib/supabase.js` (anon client), `lib/supabaseAdmin.js` (server-only service role client),
  `lib/tripOptions.js` (shared VIBE_OPTIONS/CLIMATE_OPTIONS/PACE_OPTIONS taxonomy, reused by profile,
  group target, and destinations)
- `lib/authGuard.js` — `getSafeUser()` (8s timeout, auto-signs-out corrupted sessions) and
  `safeRedirect()` (circuit breaker: max 3 redirects/8s/tab). All auth-gated pages use these
  (⚠️ except `/group/[id]`, which still calls `supabase.auth.getUser()` directly — pre-existing,
  never migrated).
- `components/EgoForm.js`, `components/EgoPicker.js` — shared alter-ego create/edit form and the
  picker modal shown on a 2nd+ group.
- `scripts/destinations-seed-data.js` (40 hand-authored destinations), `scripts/seed-destinations.js`
  (one-time/re-runnable local seeding script — `npm run seed:destinations` — pulls Open-Meteo climate +
  Unsplash photos, upserts by slug so reruns are safe. Unsplash demo tier is 50 req/hr and the script
  already skips destinations that already have photos, so partial runs resume cheaply).

## Design language
Deep navy `#0d1f2d` bg, gold `#FFD166` primary, greens `#5DCAA5`/`#1D9E75` success/tags, blue `#378ADD`,
red-ish `#F0997B` errors, dark cards `rgba(255,255,255,0.04–0.07)` with 0.5px borders, inline styles
everywhere. Planned: topo-map texture (group page), flight-path grid (landing), 12 destination-biome
pitch backgrounds (Mayan temples, cartoon beach, Roman city, deep ocean, alpine, cherry blossom,
northern lights, desert, savanna, fjords, carnival, space) as SVG art layers.

## Product decisions locked in
- Seasonal average prices, never live scraping; link out to Google Flights. Destination costs are
  **AI-estimated** ranges (not Numbeo — its real API is a paid subscription, revisit later if worth it;
  non-breaking to add since it'd just refine the same cost fields). Climate stats are **real**, pulled
  from Open-Meteo (free, no key) at seed time. Photos are **real**, from Unsplash only (Google
  Places/POI data deliberately deferred — adds Google Cloud billing setup for limited extra value right
  now).
- Pitch cards: human-written trip name/quote/"why I love it" (never auto-generated) + automated data
  layer (photos, POIs, match %, weather).
- Weather & Conditions section per pitch: honest intel (humidity, mosquitoes, hurricane season,
  jellyfish, packing list) — signature feature.
- Voting: yes/maybe/veto + separate "I'm in" commitment w/ progress bar; comments per pitch.
- Ranking: drag-order per member, group chart = avg rank (lower better), live, always visible on group
  page left column (same pattern as his other project, rankanything.org).
- Per-member hard flight limits; group effective max = most restrictive member.
- Backlog (low priority): multi-destination trips, event/festival timing awareness.

## Known issues / TODO (in order)
1. ✅ Supabase Auth URL config fixed on the correct (Castaway) project.
2. ✅ `/admin` crash fixed — confirmed working live (loads users/groups tables, no crash).
3. `groups` table PK is wrong (likely `name`) — `id` should become the real PK eventually.
4. RLS disabled everywhere — needs real policies before public launch.
5. ✅ Alter Egos shipped (schema + onboarding + profile page + ego picker on 2nd+ group + group page
   ego display/switching + admin updated).
6. ✅ Phase 3 pilot shipped — 40 destinations, real climate/photo data, `/destinations` catalog live.
7. NEXT: not yet decided with Harrison — options are (a) scale destinations from 40 → 200+ using the
   same pipeline, or (b) start Phase 4 (pitch pages) using the 40 that already exist. Ask before
   assuming.

## Roadmap status
- ✅ Phase 1 — setup/landing
- ✅ Phase 2 — auth/profiles/groups/invites/admin
- ✅ Phase 3 (pilot) — destinations schema, `/destinations` search/filter catalog, 40 destinations
  seeded with real Open-Meteo climate data + Unsplash photos, AI-estimated costs. Not yet scaled to the
  full 200+, and not yet linked to a specific vacation (that's Phase 4).
- Phase 4 — Pitch pages: link destinations to a specific vacation (match %, pitch creation), themes,
  weather section reusing `honest_intel`. Google Places/POI data and Numbeo real costs are candidates to
  revisit here if still wanted.
- Phase 5 — Live features (votes, drag-rank + live chart, comments, Supabase Realtime)
- Phase 6 — Motion + polish (animations, transitions, confetti)

## People/context
Harrison (Hzukas; harrisonzukas@gmail.com = hardcoded admin email). Test users: brother
(rjzukas@gmail.com, "Rayzor"), mom & girlfriend. Existing test groups: "Zukauskis" (code IE5YMQ),
"Zukas/Momberg Family Vacation!!!" (A7G760).
