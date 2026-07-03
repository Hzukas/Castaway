import { supabase } from './supabase'

// Validates session safely. Returns user or null. Never throws, never hangs.
// On any failure, wipes the (possibly corrupted) local session so /auth won't bounce back.
export async function getSafeUser(timeoutMs = 8000) {
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise(resolve => setTimeout(() => resolve({ data: { user: null }, error: new Error('timeout') }), timeoutMs)),
    ])
    if (result?.error || !result?.data?.user) {
      if (result?.error) await supabase.auth.signOut().catch(() => {})
      return null
    }
    return result.data.user
  } catch (e) {
    await supabase.auth.signOut().catch(() => {})
    return null
  }
}

// Redirect with a circuit breaker: max 3 redirects per 8s per tab.
// Returns false (and does NOT redirect) if a loop is detected.
export function safeRedirect(dest) {
  try {
    const now = Date.now()
    const hits = JSON.parse(sessionStorage.getItem('cw_redirects') || '[]').filter(t => now - t < 8000)
    hits.push(now)
    sessionStorage.setItem('cw_redirects', JSON.stringify(hits))
    if (hits.length > 3) return false
  } catch (e) {}
  window.location.href = dest
  return true
}