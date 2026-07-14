'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { getSafeUser, safeRedirect } from '../../../../../lib/authGuard'
import { useParams } from 'next/navigation'
import { matchPercent } from '../../../../../lib/matchScore'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PitchDetailPage() {
  const { id: groupId, pitchId } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)
  const [pitch, setPitch] = useState(null)
  const [destination, setDestination] = useState(null)
  const [personality, setPersonality] = useState(null)
  const [group, setGroup] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    const safeUser = await getSafeUser()
    if (!safeUser) {
      if (!safeRedirect('/auth')) setAuthFailed(true)
      return
    }
    setUser(safeUser)

    const { data: pitchData } = await supabase.from('pitches').select('*').eq('id', pitchId).single()
    if (!pitchData) { setError('Pitch not found.'); setLoading(false); return }
    setPitch(pitchData)

    const [{ data: destData }, { data: groupData }] = await Promise.all([
      supabase.from('destinations').select('*').eq('id', pitchData.destination_id).single(),
      supabase.from('groups').select('*').eq('id', groupId).single(),
    ])
    setDestination(destData || null)
    setGroup(groupData || null)

    if (pitchData.personality_id) {
      const { data: personalityData } = await supabase.from('personalities').select('*').eq('id', pitchData.personality_id).single()
      setPersonality(personalityData || null)
    }

    setLoading(false)
  }

  function manualSignIn() {
    try { sessionStorage.removeItem('cw_redirects') } catch (e) {}
    supabase.auth.signOut().finally(() => { window.location.href = '/auth' })
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

  if (error || !pitch || !destination) return (
    <main style={{ minHeight: '100vh', background: '#0d1f2d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginBottom: '14px' }}>{error || 'Pitch not found.'}</div>
        <button onClick={() => window.location.href = `/group/${groupId}`} style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '8px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>Back to vacation</button>
      </div>
    </main>
  )

  const pct = matchPercent(destination, group)

  return (
    <main style={{ minHeight: '100vh', background: '#0d1f2d', fontFamily: 'sans-serif' }}>
      <nav style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => window.location.href = `/group/${groupId}`} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>← Back to vacation</button>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFD166', letterSpacing: '0.05em' }}>CASTAWAY</div>
        </div>
      </nav>

      {destination.primary_photo_url && (
        <div style={{ height: '280px', background: `url(${destination.primary_photo_url}) center/cover`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d1f2d, rgba(13,31,45,0.1))' }} />
        </div>
      )}

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: destination.primary_photo_url ? '0 24px 48px' : '40px 24px 48px', marginTop: destination.primary_photo_url ? '-60px' : 0, position: 'relative' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{destination.name}, {destination.country}</div>
          <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>{pitch.trip_name}</h1>
          {pitch.quote && <div style={{ fontSize: '16px', color: '#FFD166', fontStyle: 'italic' }}>"{pitch.quote}"</div>}
        </div>

        {personality && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: personality.avatar_url ? `url(${personality.avatar_url}) center/cover` : 'rgba(255,255,255,0.1)',
              border: '1.5px solid rgba(255,255,255,0.15)',
            }} />
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Pitched by <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{personality.display_name}</strong></div>
          </div>
        )}

        {pitch.why_i_love_it && (
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '28px', whiteSpace: 'pre-wrap' }}>{pitch.why_i_love_it}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>Match</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: pct != null ? '#5DCAA5' : 'rgba(255,255,255,0.3)' }}>{pct != null ? `${pct}%` : '—'}</div>
          </div>
          {destination.cost_per_person_min != null && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>Cost / person</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>${destination.cost_per_person_min.toLocaleString()}–{destination.cost_per_person_max?.toLocaleString()}</div>
            </div>
          )}
          {destination.typical_trip_length_days && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>Trip length</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{destination.typical_trip_length_days} days</div>
            </div>
          )}
          {(destination.best_months || []).length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>Best months</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{destination.best_months.map(m => MONTH_NAMES[m - 1]).join(', ')}</div>
            </div>
          )}
        </div>

        {pct == null && (
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '24px', marginTop: '-14px' }}>Set a target on this vacation to see match %.</div>
        )}

        {(destination.vibe_tags || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '28px' }}>
            {destination.vibe_tags.map(tag => (
              <span key={tag} style={{ fontSize: '11px', color: '#5DCAA5', background: 'rgba(29,158,117,0.12)', border: '0.5px solid rgba(29,158,117,0.3)', borderRadius: '20px', padding: '3px 10px' }}>{tag}</span>
            ))}
          </div>
        )}

        {(destination.photo_urls || []).length > 1 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Photos</div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {destination.photo_urls.map((url, i) => (
                <div key={i} style={{ minWidth: '220px', height: '150px', borderRadius: '12px', background: `url(${url}) center/cover`, flexShrink: 0 }} />
              ))}
            </div>
          </div>
        )}

        {(destination.honest_intel || []).length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Weather & conditions — the honest version</div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {destination.honest_intel.map((bullet, i) => (
                <li key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: '5px' }}>{bullet}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ background: '#0f0f13', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>🏆 Voting & ranking</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Coming in the next phase — for now, talk it over with your group.</div>
        </div>
      </div>
    </main>
  )
}
