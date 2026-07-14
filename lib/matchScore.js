// Compares a destination against a group's target. Returns null when the group
// hasn't set a target yet (no vibe_tags) — a % would be meaningless at that point.
export function matchPercent(destination, group) {
  const groupVibes = group?.vibe_tags || []
  if (groupVibes.length === 0) return null

  const destVibes = destination?.vibe_tags || []
  const overlap = destVibes.filter(v => groupVibes.includes(v)).length
  let pct = Math.round((overlap / groupVibes.length) * 100)

  if (group.travel_type === 'domestic_only' && destination?.passport_required) {
    pct = Math.min(pct, 20)
  }

  return pct
}
