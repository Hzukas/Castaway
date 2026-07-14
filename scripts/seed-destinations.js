// One-time (re-runnable) seeding script — run locally with: node scripts/seed-destinations.js
// Pulls real climate data from Open-Meteo (no key needed) and photos from Unsplash
// (needs UNSPLASH_ACCESS_KEY in .env.local), then upserts everything into Supabase.
// Safe to re-run: upserts on `slug`, so it refreshes rather than duplicates rows.

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const destinations = require('./destinations-seed-data.js')

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
if (!UNSPLASH_ACCESS_KEY) {
  console.error('Missing UNSPLASH_ACCESS_KEY in .env.local — create a free app at unsplash.com/developers first.')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

// Uses the most recent fully-completed calendar year so Open-Meteo's archive has full data.
function lastFullYear() {
  return new Date().getFullYear() - 1
}

async function fetchClimateStats(lat, lng) {
  const year = lastFullYear()
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${year}-01-01&end_date=${year}-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const data = await res.json()
  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily

  const months = Array.from({ length: 12 }, () => ({ highs: [], lows: [], precip: 0 }))
  time.forEach((dateStr, i) => {
    const month = Number(dateStr.slice(5, 7)) - 1
    if (temperature_2m_max[i] != null) months[month].highs.push(temperature_2m_max[i])
    if (temperature_2m_min[i] != null) months[month].lows.push(temperature_2m_min[i])
    if (precipitation_sum[i] != null) months[month].precip += precipitation_sum[i]
  })

  const avg = arr => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null

  return {
    source_year: year,
    monthly: months.map((m, i) => ({
      month: i + 1,
      avg_high_c: avg(m.highs),
      avg_low_c: avg(m.lows),
      precip_mm: Math.round(m.precip),
    })),
  }
}

async function fetchUnsplashPhotos(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } })
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  const data = await res.json()
  const results = (data.results || []).slice(0, 4)
  if (results.length === 0) return { primary_photo_url: null, photo_urls: [] }

  // Unsplash API guidelines require pinging download_location when a photo is actually used.
  await fetch(`${results[0].links.download_location}&client_id=${UNSPLASH_ACCESS_KEY}`).catch(() => {})

  return {
    primary_photo_url: results[0].urls.regular,
    photo_urls: results.map(r => r.urls.regular),
  }
}

async function seedOne(dest, existing) {
  const climate_stats = await fetchClimateStats(dest.lat, dest.lng)

  let primary_photo_url, photo_urls
  if (existing?.primary_photo_url) {
    // Already has real photos from a previous run — don't spend Unsplash quota re-fetching.
    primary_photo_url = existing.primary_photo_url
    photo_urls = existing.photo_urls
  } else {
    ;({ primary_photo_url, photo_urls } = await fetchUnsplashPhotos(`${dest.name} ${dest.country}`))
  }

  const { error } = await supabaseAdmin.from('destinations').upsert({
    slug: dest.slug,
    name: dest.name,
    country: dest.country,
    region: dest.region,
    tagline: dest.tagline,
    description: dest.description,
    vibe_tags: dest.vibe_tags,
    climate_tags: dest.climate_tags,
    passport_required: dest.passport_required,
    best_months: dest.best_months,
    typical_trip_length_days: dest.typical_trip_length_days,
    cost_per_person_min: dest.cost_per_person_min,
    cost_per_person_max: dest.cost_per_person_max,
    climate_stats,
    honest_intel: dest.honest_intel,
    lat: dest.lat,
    lng: dest.lng,
    primary_photo_url,
    photo_urls,
  }, { onConflict: 'slug' })

  if (error) throw error
}

async function main() {
  const { data: existingRows } = await supabaseAdmin.from('destinations').select('slug, primary_photo_url, photo_urls')
  const existingBySlug = new Map((existingRows || []).map(r => [r.slug, r]))
  const alreadyHavePhotos = [...existingBySlug.values()].filter(r => r.primary_photo_url).length
  if (alreadyHavePhotos) console.log(`${alreadyHavePhotos} destinations already have photos — skipping Unsplash for those.\n`)

  console.log(`Seeding ${destinations.length} destinations...\n`)
  let ok = 0, failed = []

  for (const dest of destinations) {
    try {
      await seedOne(dest, existingBySlug.get(dest.slug))
      console.log(`✓ ${dest.name}`)
      ok++
    } catch (e) {
      console.log(`✗ ${dest.name} — ${e.message}`)
      failed.push(dest.name)
    }
    await sleep(1500) // stay well under Unsplash's demo rate limit
  }

  console.log(`\nDone. ${ok}/${destinations.length} seeded.`)
  if (failed.length) {
    console.log(`Failed (re-run this script to retry — it's safe, upserts by slug): ${failed.join(', ')}`)
  }
}

main()
