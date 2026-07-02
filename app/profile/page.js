'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const VIBE_OPTIONS = ['beach','wildlife','mountains','city','jungle','snow','snorkeling','hiking','nightlife','food','history','kid-friendly','off-grid','luxury']

const PACE_OPTIONS = [
  { value: 'relaxed', label: '😌 Relaxed', sub: 'Slow days, lots of downtime' },
  { value: 'moderate', label: '🚶 Moderate', sub: 'Mix of activity and rest' },
  { value: 'packed', label: '⚡ Packed', sub: 'See everything, go hard' },
]

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    display_name: '',
    home_airport: '',
    passport_holder: true,
    max_flight_hours: '',
    budget_min: '',
    budget_max: '',
    budget_flexible: true,
    vibe_tags: [],
    travel_pace: 'moderate',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) window.location.href = '/auth'
      else { setUser(user); loadProfile(user.id) }
    })
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
    if (data) {
      setProfile({
        display_name: data.display_name || '',
        home_airport: data.home_airport || '',
        passport_holder: data.passport_holder ?? true,
        max_flight_hours: data.max_flight_hours || '',
        budget_min: data.budget_min || '',
        budget_max: data.budget_max || '',
        budget_flexible: data.budget_flexible ?? true,
        vibe_tags: data.vibe_tags || [],
        travel_pace: data.travel_pace || 'moderate',
      })
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: profile.display_name || null,
      home_airport: profile.home_airport || null,
      passport_holder: profile.passport_holder,
      max_flight_hours: profile.max_flight_hours || null,
      budget_min: profile.budget_min || null,
      budget_max: profile.budget_max || null,
      budget_flexible: profile.budget_flexible,
      vibe_tags: profile.vibe_tags,
      travel_pace: profile.travel_pace,
    }, { onConflict: 'user_id' })
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  function toggleVibe(tag) {
    setProfile(p => ({
      ...p,
      vibe_tags: p.vibe_tags.includes(tag)
        ? p.vibe_tags.filter(v => v !== tag)
        : [...p.vibe_tags, tag]
    }))
  }

  const input = (style={}) => ({
    width:'100%',padding:'10px 14px',borderRadius:'8px',
    border:'0.5px solid rgba(255,255,255,0.15)',
    background:'rgba(255,255,255,0.07)',color:'#fff',
    fontSize:'14px',outline:'none',boxSizing:'border-box',
    ...style
  })

  if (loading) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif'}}>Loading...</div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',fontFamily:'sans-serif'}}>
      <nav style={{
        padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:'0.5px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <button onClick={()=>window.location.href='/dashboard'} style={{
            background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer',
          }}>← Back</button>
          <div style={{fontSize:'18px',fontWeight:700,color:'#FFD166',letterSpacing:'0.05em'}}>CASTAWAY</div>
        </div>
        <span style={{fontSize:'13px',color:'rgba(255,255,255,0.35)'}}>{user?.email}</span>
      </nav>

      <div style={{maxWidth:'640px',margin:'0 auto',padding:'48px 24px'}}>
        <div style={{marginBottom:'32px'}}>
          <h1 style={{fontSize:'28px',fontWeight:700,color:'#fff',margin:'0 0 8px'}}>Your travel profile</h1>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:'15px',margin:0}}>
            This info carries into every group you join — no need to re-enter it each time.
          </p>
        </div>

        {/* BASICS */}
        <div style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'20px 24px',marginBottom:'16px'}}>
          <div style={{fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'16px'}}>Basics</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
            <div style={{gridColumn:'1/-1'}}>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Display name</div>
              <input
                value={profile.display_name}
                onChange={e=>setProfile(p=>({...p,display_name:e.target.value}))}
                placeholder="e.g. Harrison"
                style={input()}
              />
            </div>
            <div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Home airport</div>
              <input
                value={profile.home_airport}
                onChange={e=>setProfile(p=>({...p,home_airport:e.target.value.toUpperCase()}))}
                placeholder="DEN"
                maxLength={3}
                style={input()}
              />
            </div>
            <div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Passport holder?</div>
              <div style={{display:'flex',gap:'8px'}}>
                {['Yes','No'].map(opt=>(
                  <button key={opt} onClick={()=>setProfile(p=>({...p,passport_holder:opt==='Yes'}))} style={{
                    flex:1,padding:'10px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontWeight:500,
                    background: (opt==='Yes'&&profile.passport_holder)||(opt==='No'&&!profile.passport_holder) ? 'rgba(255,209,102,0.15)' : 'rgba(255,255,255,0.05)',
                    border: (opt==='Yes'&&profile.passport_holder)||(opt==='No'&&!profile.passport_holder) ? '0.5px solid rgba(255,209,102,0.4)' : '0.5px solid rgba(255,255,255,0.1)',
                    color: (opt==='Yes'&&profile.passport_holder)||(opt==='No'&&!profile.passport_holder) ? '#FFD166' : 'rgba(255,255,255,0.4)',
                  }}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FLIGHT PREFERENCES */}
        <div style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'20px 24px',marginBottom:'16px'}}>
          <div style={{fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'16px'}}>Flight preferences</div>
          <div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Max flight hours</div>
            <input
              type="number"
              value={profile.max_flight_hours}
              onChange={e=>setProfile(p=>({...p,max_flight_hours:e.target.value}))}
              placeholder="Leave blank for no limit"
              style={input()}
            />
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',marginTop:'6px'}}>
              This becomes a hard limit in any group you join. Leave blank if you're flexible.
            </div>
          </div>
        </div>

        {/* BUDGET */}
        <div style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'20px 24px',marginBottom:'16px'}}>
          <div style={{fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'16px'}}>Budget comfort</div>
          
          <div style={{marginBottom:'14px'}}>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>How do you approach trip budgets?</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setProfile(p=>({...p,budget_flexible:true}))} style={{
                flex:1,padding:'10px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',
                background: profile.budget_flexible ? 'rgba(255,209,102,0.15)' : 'rgba(255,255,255,0.05)',
                border: profile.budget_flexible ? '0.5px solid rgba(255,209,102,0.4)' : '0.5px solid rgba(255,255,255,0.1)',
                color: profile.budget_flexible ? '#FFD166' : 'rgba(255,255,255,0.4)',
              }}>
                <div style={{fontWeight:500}}>Flexible</div>
                <div style={{fontSize:'11px',opacity:0.7,marginTop:'2px'}}>No hard limit</div>
              </button>
              <button onClick={()=>setProfile(p=>({...p,budget_flexible:false}))} style={{
                flex:1,padding:'10px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',
                background: !profile.budget_flexible ? 'rgba(255,209,102,0.15)' : 'rgba(255,255,255,0.05)',
                border: !profile.budget_flexible ? '0.5px solid rgba(255,209,102,0.4)' : '0.5px solid rgba(255,255,255,0.1)',
                color: !profile.budget_flexible ? '#FFD166' : 'rgba(255,255,255,0.4)',
              }}>
                <div style={{fontWeight:500}}>Set a range</div>
                <div style={{fontSize:'11px',opacity:0.7,marginTop:'2px'}}>Min and max per trip</div>
              </button>
            </div>
          </div>

          {!profile.budget_flexible && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Min budget ($)</div>
                <input type="number" value={profile.budget_min}
                  onChange={e=>setProfile(p=>({...p,budget_min:e.target.value}))}
                  placeholder="e.g. 1000"
                  style={input()}
                />
              </div>
              <div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Max budget ($)</div>
                <input type="number" value={profile.budget_max}
                  onChange={e=>setProfile(p=>({...p,budget_max:e.target.value}))}
                  placeholder="e.g. 3000"
                  style={input()}
                />
              </div>
            </div>
          )}
        </div>

        {/* TRAVEL STYLE */}
        <div style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'20px 24px',marginBottom:'16px'}}>
          <div style={{fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'16px'}}>Travel style</div>
          
          <div style={{marginBottom:'16px'}}>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>Travel pace</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {PACE_OPTIONS.map(opt=>(
                <button key={opt.value} onClick={()=>setProfile(p=>({...p,travel_pace:opt.value}))} style={{
                  padding:'10px 14px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',textAlign:'left',
                  background: profile.travel_pace===opt.value ? 'rgba(255,209,102,0.12)' : 'rgba(255,255,255,0.04)',
                  border: profile.travel_pace===opt.value ? '0.5px solid rgba(255,209,102,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
                  color: profile.travel_pace===opt.value ? '#FFD166' : 'rgba(255,255,255,0.5)',
                  display:'flex',justifyContent:'space-between',alignItems:'center',
                }}>
                  <span style={{fontWeight:500}}>{opt.label}</span>
                  <span style={{fontSize:'11px',opacity:0.7}}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>Vibe preferences</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
              {VIBE_OPTIONS.map(tag=>(
                <button key={tag} onClick={()=>toggleVibe(tag)} style={{
                  padding:'5px 12px',borderRadius:'20px',fontSize:'12px',cursor:'pointer',
                  background: profile.vibe_tags.includes(tag) ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.05)',
                  border: profile.vibe_tags.includes(tag) ? '0.5px solid rgba(29,158,117,0.4)' : '0.5px solid rgba(255,255,255,0.1)',
                  color: profile.vibe_tags.includes(tag) ? '#5DCAA5' : 'rgba(255,255,255,0.4)',
                }}>{tag}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={saveProfile} disabled={saving} style={{
          width:'100%',padding:'14px',borderRadius:'10px',
          background: saved ? 'rgba(29,158,117,0.2)' : '#FFD166',
          border: saved ? '0.5px solid rgba(29,158,117,0.4)' : 'none',
          color: saved ? '#5DCAA5' : '#1a0e00',
          fontSize:'15px',fontWeight:700,cursor:'pointer',
        }}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save profile'}
        </button>
      </div>
    </main>
  )
}