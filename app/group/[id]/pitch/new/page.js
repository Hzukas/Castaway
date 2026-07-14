'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { getSafeUser, safeRedirect } from '../../../../../lib/authGuard'
import { useParams, useSearchParams } from 'next/navigation'

export default function NewPitchPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: '#0d1f2d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'sans-serif' }}>Loading...</div>
      </main>
    }>
      <NewPitchPageInner />
    </Suspense>
  )
}

function NewPitchPageInner() {
  const { id: groupId } = useParams()
  const searchParams = useSearchParams()
  const destinationId = searchParams.get('destination')

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)
  const [destination, setDestination] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [tripName, setTripName] = useState('')
  const [quote, setQuote] = useState('')
  const [whyILoveIt, setWhyILoveIt] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    if (!destinationId) { setError('No destination selected.'); setLoading(false); return }
    const safeUser = await getSafeUser()
    if (!safeUser) {
      if (!safeRedirect('/auth')) setAuthFailed(true)
      return
    }
    setUser(safeUser)
    const { data } = await supabase.from('destinations').select('*').eq('id', destinationId).single()
    if (!data) { setError('Destination not found.'); setLoading(false); return }
    setDestination(data)
    setLoading(false)
  }

  function manualSignIn() {
    try { sessionStorage.removeItem('cw_redirects') } catch (e) {}
    supabase.auth.signOut().finally(() => { window.location.href = '/auth' })
  }

  async function submitPitch() {
    if (!tripName.trim()) { setError('Give your pitch a trip name.'); return }
    setSaving(true)
    setError('')

    const { data: membership } = await supabase.from('group_members').select('personality_id').eq('group_id', groupId).eq('user_id', user.id).single()

    const { data, error: insertError } = await supabase.from('pitches').insert({
      group_id: groupId,
      destination_id: destinationId,
      created_by: user.id,
      personality_id: membership?.personality_id || null,
      trip_name: tripName.trim(),
      quote: quote.trim() || null,
      why_i_love_it: whyILoveIt.trim() || null,
    }).select().single()

    setSaving(false)
    if (insertError || !data) { setError('Something went wrong, try again.'); return }
    window.location.href = `/group/${groupId}/pitch/${data.id}`
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '8px',
    border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#0d1f2d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        {authFailed ? (
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '14px' }}>Your session needs a refresh.</div>
            <button onClick={manualSignIn} style={{ background: '#FFD166', color: '#1a0e00', border: 'none', borderRadius: '8px', padding: '10px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Sign in</button>
          </div>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</div>
        )}
      </div>
    </main>
  )

  if (!destination) return (
    <main style={{ minHeight: '100vh', background: '#0d1f2d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '14px' }}>{error || 'Something went wrong.'}</div>
        <button onClick={() => window.location.href = `/group/${groupId}`} style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '8px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>Back to vacation</button>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#0d1f2d', fontFamily: 'sans-serif' }}>
      <nav style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => window.location.href = `/group/${groupId}`} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>← Back to vacation</button>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFD166', letterSpacing: '0.05em' }}>CASTAWAY</div>
        </div>
      </nav>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '10px', flexShrink: 0, background: destination.primary_photo_url ? `url(${destination.primary_photo_url}) center/cover` : 'rgba(255,255,255,0.08)' }} />
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Pitching</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{destination.name}, {destination.country}</div>
          </div>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Make your case</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 24px' }}>This is your pitch — the automated data (photos, weather, match %) gets added for you. Just write why this trip.</p>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Trip name</div>
          <input value={tripName} onChange={e => { setTripName(e.target.value); setError('') }} placeholder="e.g. Sunset Chasers: Santorini Edition" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Quote (a one-liner that sells it)</div>
          <input value={quote} onChange={e => setQuote(e.target.value)} placeholder="e.g. Basically a floating vacation from responsibility" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Why I love it</div>
          <textarea value={whyILoveIt} onChange={e => setWhyILoveIt(e.target.value)} placeholder="Tell the group what makes this trip worth it..." rows={6}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        {error && <div style={{ color: '#F0997B', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}

        <button onClick={submitPitch} disabled={saving} style={{
          width: '100%', padding: '14px', borderRadius: '10px', background: '#FFD166', color: '#1a0e00',
          border: 'none', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
        }}>{saving ? 'Pitching...' : 'Submit pitch'}</button>
      </div>
    </main>
  )
}
