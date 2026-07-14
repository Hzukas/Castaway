'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getSafeUser, safeRedirect } from '../../lib/authGuard'
import { VIBE_OPTIONS, CLIMATE_OPTIONS } from '../../lib/tripOptions'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function DestinationsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)
  const [destinations, setDestinations] = useState([])

  const [search, setSearch] = useState('')
  const [vibeFilter, setVibeFilter] = useState([])
  const [climateFilter, setClimateFilter] = useState([])
  const [passportFilter, setPassportFilter] = useState('any') // 'any' | 'domestic' | 'international'
  const [budgetMax, setBudgetMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [expanded, setExpanded] = useState(null)

  useEffect(() => { init() }, [])

  async function init() {
    const safeUser = await getSafeUser()
    if (!safeUser) {
      if (!safeRedirect('/auth')) setAuthFailed(true)
      return
    }
    setUser(safeUser)
    const { data } = await supabase.from('destinations').select('*').order('name', { ascending: true })
    if (data) setDestinations(data)
    setLoading(false)
  }

  function toggleVibe(tag) {
    setVibeFilter(f => f.includes(tag) ? f.filter(v => v !== tag) : [...f, tag])
  }
  function toggleClimate(val) {
    setClimateFilter(f => f.includes(val) ? f.filter(v => v !== val) : [...f, val])
  }

  function manualSignIn() {
    try { sessionStorage.removeItem('cw_redirects') } catch (e) {}
    supabase.auth.signOut().finally(() => { window.location.href = '/auth' })
  }

  const filtered = destinations.filter(d => {
    if (search && !`${d.name} ${d.country} ${d.region || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    if (vibeFilter.length && !vibeFilter.some(v => (d.vibe_tags || []).includes(v))) return false
    if (climateFilter.length && !climateFilter.some(c => (d.climate_tags || []).includes(c))) return false
    if (passportFilter === 'domestic' && d.passport_required) return false
    if (passportFilter === 'international' && !d.passport_required) return false
    if (budgetMax && d.cost_per_person_min != null && d.cost_per_person_min > Number(budgetMax)) return false
    return true
  })

  const activeFilterCount = vibeFilter.length + climateFilter.length + (passportFilter !== 'any' ? 1 : 0) + (budgetMax ? 1 : 0)

  const chipStyle = (active, color) => ({
    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
    background: active ? `${color}26` : 'rgba(255,255,255,0.05)',
    border: active ? `0.5px solid ${color}66` : '0.5px solid rgba(255,255,255,0.1)',
    color: active ? color : 'rgba(255,255,255,0.4)',
  })

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

  return (
    <main style={{ minHeight: '100vh', background: '#0d1f2d', fontFamily: 'sans-serif' }}>
      <nav style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFD166', letterSpacing: '0.05em' }}>CASTAWAY</div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Explore destinations</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', margin: 0 }}>{destinations.length} destinations to browse — search, filter, and dig into the honest details on each.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, country, or region..."
            style={{ flex: 1, padding: '11px 16px', borderRadius: '10px', border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '14px', outline: 'none' }}
          />
          <button onClick={() => setShowFilters(!showFilters)} style={{
            background: showFilters || activeFilterCount ? 'rgba(255,209,102,0.15)' : 'rgba(255,255,255,0.07)',
            border: showFilters || activeFilterCount ? '0.5px solid rgba(255,209,102,0.4)' : '0.5px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', padding: '11px 20px', color: showFilters || activeFilterCount ? '#FFD166' : 'rgba(255,255,255,0.6)',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</button>
        </div>

        {showFilters && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Vibe</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {VIBE_OPTIONS.map(tag => (
                  <button key={tag} onClick={() => toggleVibe(tag)} style={chipStyle(vibeFilter.includes(tag), '#5DCAA5')}>{tag}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Climate</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CLIMATE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => toggleClimate(opt.value)} style={chipStyle(climateFilter.includes(opt.value), '#378ADD')}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Passport</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[['any', 'Any'], ['domestic', 'Domestic only'], ['international', 'International ok']].map(([val, label]) => (
                    <button key={val} onClick={() => setPassportFilter(val)} style={chipStyle(passportFilter === val, '#FFD166')}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Max budget per person ($)</div>
                <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="No limit"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            {destinations.length === 0 ? 'No destinations seeded yet.' : 'Nothing matches those filters — try loosening them up.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {filtered.map(d => (
              <div key={d.id} onClick={() => setExpanded(d)} style={{
                background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,209,102,0.4)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                <div style={{ height: '140px', background: d.primary_photo_url ? `url(${d.primary_photo_url}) center/cover` : 'rgba(255,255,255,0.08)' }} />
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{d.name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>{d.country}</div>
                  {d.tagline && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', lineHeight: 1.4 }}>{d.tagline}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                    {(d.vibe_tags || []).slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: '10px', color: '#5DCAA5', background: 'rgba(29,158,117,0.12)', border: '0.5px solid rgba(29,158,117,0.3)', borderRadius: '20px', padding: '2px 8px' }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {d.cost_per_person_min != null && (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFD166' }}>${d.cost_per_person_min.toLocaleString()}–{d.cost_per_person_max?.toLocaleString()}</span>
                    )}
                    {d.passport_required && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>🛂 passport</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {expanded && <DestinationDetail destination={expanded} onClose={() => setExpanded(null)} />}
    </main>
  )
}

function DestinationDetail({ destination: d, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#0d1f2d', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {d.primary_photo_url && <div style={{ height: '200px', background: `url(${d.primary_photo_url}) center/cover`, borderRadius: '16px 16px 0 0' }} />}
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{d.name}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{d.region ? `${d.region}, ` : ''}{d.country}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '8px', width: '30px', height: '30px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer' }}>✕</button>
          </div>

          {d.tagline && <div style={{ fontSize: '14px', color: '#FFD166', margin: '10px 0', fontStyle: 'italic' }}>{d.tagline}</div>}

          {(d.photo_urls || []).length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', margin: '14px 0', paddingBottom: '4px' }}>
              {d.photo_urls.map((url, i) => (
                <div key={i} style={{ minWidth: '160px', height: '100px', borderRadius: '10px', background: `url(${url}) center/cover`, flexShrink: 0 }} />
              ))}
            </div>
          )}

          {d.description && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '14px 0' }}>{d.description}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '16px 0' }}>
            {d.cost_per_person_min != null && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>Est. cost / person</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>${d.cost_per_person_min.toLocaleString()}–{d.cost_per_person_max?.toLocaleString()}</div>
              </div>
            )}
            {d.typical_trip_length_days && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>Typical trip</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{d.typical_trip_length_days} days</div>
              </div>
            )}
            {(d.best_months || []).length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 14px', gridColumn: '1/-1' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '3px' }}>Best months</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{d.best_months.map(m => MONTH_NAMES[m - 1]).join(', ')}</div>
              </div>
            )}
          </div>

          {(d.vibe_tags || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {d.vibe_tags.map(tag => (
                <span key={tag} style={{ fontSize: '11px', color: '#5DCAA5', background: 'rgba(29,158,117,0.12)', border: '0.5px solid rgba(29,158,117,0.3)', borderRadius: '20px', padding: '3px 10px' }}>{tag}</span>
              ))}
            </div>
          )}

          {(d.honest_intel || []).length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px 18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Weather & conditions — the honest version</div>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {d.honest_intel.map((bullet, i) => (
                  <li key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '4px' }}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
