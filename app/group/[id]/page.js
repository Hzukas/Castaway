'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'

const VIBE_OPTIONS = ['beach','wildlife','mountains','city','jungle','snow','snorkeling','hiking','nightlife','food','history','kid-friendly','off-grid','luxury']

export default function GroupPage() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [editingTarget, setEditingTarget] = useState(false)
  const [editingFlight, setEditingFlight] = useState(false)

  const [target, setTarget] = useState({
    target_budget: '',
    target_days: '',
    travel_window: '',
    travel_type: 'no_preference',
    vibe_tags: [],
  })

  const [flightLimit, setFlightLimit] = useState({
    home_airport: '',
    max_flight_hours: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) window.location.href = '/auth'
      else { setUser(user); loadGroup(); loadMembers() }
    })
  }, [])

  async function loadGroup() {
    const { data } = await supabase.from('groups').select('*').eq('id', id).single()
    if (data) {
      setGroup(data)
      setTarget({
        target_budget: data.target_budget || '',
        target_days: data.target_days || '',
        travel_window: data.travel_window || '',
        travel_type: data.travel_type || 'no_preference',
        vibe_tags: data.vibe_tags || [],
      })
    }
    setLoading(false)
  }

  async function loadMembers() {
    const { data } = await supabase.from('group_members').select('*').eq('group_id', id)
    if (data) setMembers(data)
  }

  async function saveTarget() {
    const { error } = await supabase.from('groups').update({
      target_budget: target.target_budget || null,
      target_days: target.target_days || null,
      travel_window: target.travel_window || null,
      travel_type: target.travel_type,
      vibe_tags: target.vibe_tags,
    }).eq('id', id)
    if (!error) { setEditingTarget(false); loadGroup() }
  }

  async function saveFlightLimit() {
    const existing = members.find(m => m.user_id === user.id)
    if (existing) {
      await supabase.from('group_members').update({
        home_airport: flightLimit.home_airport,
        max_flight_hours: flightLimit.max_flight_hours || null,
      }).eq('id', existing.id)
    } else {
      await supabase.from('group_members').insert({
        group_id: id,
        user_id: user.id,
        email: user.email,
        home_airport: flightLimit.home_airport,
        max_flight_hours: flightLimit.max_flight_hours || null,
      })
    }
    setEditingFlight(false)
    loadMembers()
  }

  function toggleVibe(tag) {
    setTarget(t => ({
      ...t,
      vibe_tags: t.vibe_tags.includes(tag)
        ? t.vibe_tags.filter(v => v !== tag)
        : [...t.vibe_tags, tag]
    }))
  }

  function copyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${group.invite_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const effectiveMaxFlight = members.length > 0
    ? Math.min(...members.filter(m => m.max_flight_hours).map(m => m.max_flight_hours))
    : null

  const myMember = members.find(m => m.user_id === user?.id)

  const travelTypeLabel = {
    domestic_only: '🇺🇸 Domestic only',
    international_ok: '🌍 International ok',
    no_preference: '✈️ No preference',
  }

  const travelTypeOptions = [
    { value: 'no_preference', label: 'No preference', sub: 'Show everything' },
    { value: 'international_ok', label: 'International ok', sub: 'Passport holders, open to anything' },
    { value: 'domestic_only', label: 'Domestic only', sub: 'No passport needed, US only' },
  ]

  if (loading) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif'}}>Loading...</div>
    </main>
  )

  if (!group) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif'}}>Group not found.</div>
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
            background:'none',border:'none',color:'rgba(255,255,255,0.4)',
            fontSize:'13px',cursor:'pointer',
          }}>← Back</button>
          <div style={{fontSize:'18px',fontWeight:700,color:'#FFD166',letterSpacing:'0.05em'}}>CASTAWAY</div>
        </div>
        <button onClick={copyInvite} style={{
          background: copied ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.07)',
          border: copied ? '0.5px solid rgba(29,158,117,0.4)' : '0.5px solid rgba(255,255,255,0.12)',
          borderRadius:'8px',padding:'8px 16px',
          color: copied ? '#5DCAA5' : 'rgba(255,255,255,0.6)',
          fontSize:'13px',cursor:'pointer',
        }}>
          {copied ? '✓ Link copied!' : 'Invite members'}
        </button>
      </nav>

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'40px 24px'}}>
        <div style={{marginBottom:'32px'}}>
          <h1 style={{fontSize:'32px',fontWeight:700,color:'#fff',margin:'0 0 6px'}}>{group.name}</h1>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.35)'}}>
            Invite code: <span style={{color:'#FFD166',fontWeight:600}}>{group.invite_code}</span>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'24px',alignItems:'start'}}>
          <div>

            {/* GROUP TARGET PANEL */}
            <div style={{
              background:'rgba(255,255,255,0.04)',
              border:'0.5px solid rgba(255,255,255,0.08)',
              borderRadius:'12px',padding:'20px 24px',marginBottom:'16px',
            }}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                <div style={{fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',textTransform:'uppercase'}}>
                  Group target
                </div>
                <button onClick={()=>setEditingTarget(!editingTarget)} style={{
                  background:'none',border:'0.5px solid rgba(255,255,255,0.12)',
                  borderRadius:'6px',padding:'4px 12px',color:'rgba(255,255,255,0.4)',
                  fontSize:'12px',cursor:'pointer',
                }}>{editingTarget ? 'Cancel' : 'Edit'}</button>
              </div>

              {editingTarget ? (
                <div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                    <div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Budget per person ($)</div>
                      <input type="number" value={target.target_budget}
                        onChange={e=>setTarget(t=>({...t,target_budget:e.target.value}))}
                        placeholder="e.g. 2500"
                        style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'0.5px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
                      />
                    </div>
                    <div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Trip length (days)</div>
                      <input type="number" value={target.target_days}
                        onChange={e=>setTarget(t=>({...t,target_days:e.target.value}))}
                        placeholder="e.g. 7"
                        style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'0.5px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
                      />
                    </div>
                    <div style={{gridColumn:'1/-1'}}>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Travel window</div>
                      <input type="text" value={target.travel_window}
                        onChange={e=>setTarget(t=>({...t,travel_window:e.target.value}))}
                        placeholder="e.g. March–May 2026"
                        style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'0.5px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
                      />
                    </div>
                  </div>

                  <div style={{marginBottom:'14px'}}>
                    <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>Travel type</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                      {travelTypeOptions.map(opt=>(
                        <button key={opt.value} onClick={()=>setTarget(t=>({...t,travel_type:opt.value}))} style={{
                          padding:'10px 14px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',textAlign:'left',
                          background: target.travel_type===opt.value ? 'rgba(255,209,102,0.12)' : 'rgba(255,255,255,0.04)',
                          border: target.travel_type===opt.value ? '0.5px solid rgba(255,209,102,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
                          color: target.travel_type===opt.value ? '#FFD166' : 'rgba(255,255,255,0.5)',
                          display:'flex',justifyContent:'space-between',alignItems:'center',
                        }}>
                          <span style={{fontWeight:500}}>{opt.label}</span>
                          <span style={{fontSize:'11px',opacity:0.7}}>{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{marginBottom:'16px'}}>
                    <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>Vibe tags</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                      {VIBE_OPTIONS.map(tag=>(
                        <button key={tag} onClick={()=>toggleVibe(tag)} style={{
                          padding:'5px 12px',borderRadius:'20px',fontSize:'12px',cursor:'pointer',
                          background: target.vibe_tags.includes(tag) ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.05)',
                          border: target.vibe_tags.includes(tag) ? '0.5px solid rgba(29,158,117,0.4)' : '0.5px solid rgba(255,255,255,0.1)',
                          color: target.vibe_tags.includes(tag) ? '#5DCAA5' : 'rgba(255,255,255,0.4)',
                        }}>{tag}</button>
                      ))}
                    </div>
                  </div>

                  <button onClick={saveTarget} style={{
                    background:'#FFD166',color:'#1a0e00',border:'none',
                    borderRadius:'8px',padding:'10px 24px',fontSize:'14px',
                    fontWeight:700,cursor:'pointer',
                  }}>Save target</button>
                </div>
              ) : (
                <div>
                  {!group.target_budget && !group.target_days && (group.vibe_tags||[]).length===0 ? (
                    <div style={{color:'rgba(255,255,255,0.35)',fontSize:'14px',marginBottom:'12px'}}>
                      No target set yet. Set a budget, travel dates, and vibe so everyone knows what you're aiming for.
                    </div>
                  ) : (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
                      {group.target_budget && (
                        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'10px 14px'}}>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'3px'}}>Budget/person</div>
                          <div style={{fontSize:'16px',fontWeight:600,color:'#fff'}}>${Number(group.target_budget).toLocaleString()}</div>
                        </div>
                      )}
                      {group.target_days && (
                        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'10px 14px'}}>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'3px'}}>Trip length</div>
                          <div style={{fontSize:'16px',fontWeight:600,color:'#fff'}}>{group.target_days} days</div>
                        </div>
                      )}
                      {group.travel_window && (
                        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'10px 14px'}}>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'3px'}}>Travel window</div>
                          <div style={{fontSize:'15px',fontWeight:600,color:'#fff'}}>{group.travel_window}</div>
                        </div>
                      )}
                      {effectiveMaxFlight && (
                        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'10px 14px'}}>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'3px'}}>Max flight time</div>
                          <div style={{fontSize:'16px',fontWeight:600,color:'#fff'}}>{effectiveMaxFlight}h</div>
                        </div>
                      )}
                      {group.travel_type && group.travel_type !== 'no_preference' && (
                        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'10px 14px'}}>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'3px'}}>Travel type</div>
                          <div style={{fontSize:'14px',fontWeight:600,color:'#fff'}}>{travelTypeLabel[group.travel_type]}</div>
                        </div>
                      )}
                      {(group.vibe_tags||[]).length > 0 && (
                        <div style={{gridColumn:'1/-1',display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'4px'}}>
                          {group.vibe_tags.map(tag=>(
                            <span key={tag} style={{
                              padding:'3px 10px',borderRadius:'20px',fontSize:'12px',
                              background:'rgba(29,158,117,0.15)',border:'0.5px solid rgba(29,158,117,0.3)',color:'#5DCAA5',
                            }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button style={{
                    width:'100%',padding:'10px',borderRadius:'8px',
                    background:'rgba(255,255,255,0.03)',
                    border:'0.5px dashed rgba(255,255,255,0.1)',
                    color:'rgba(255,255,255,0.35)',fontSize:'12px',cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',
                  }}>
                    🔍 What's limiting your destination options?
                  </button>
                </div>
              )}
            </div>

            {/* MEMBER FLIGHT LIMITS */}
            <div style={{
              background:'rgba(255,255,255,0.04)',
              border:'0.5px solid rgba(255,255,255,0.08)',
              borderRadius:'12px',padding:'20px 24px',marginBottom:'16px',
            }}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                <div style={{fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',textTransform:'uppercase'}}>
                  Member flight limits
                </div>
                <button onClick={()=>{
                  if(myMember){setFlightLimit({home_airport:myMember.home_airport||'',max_flight_hours:myMember.max_flight_hours||''})}
                  setEditingFlight(!editingFlight)
                }} style={{
                  background:'none',border:'0.5px solid rgba(255,255,255,0.12)',
                  borderRadius:'6px',padding:'4px 12px',color:'rgba(255,255,255,0.4)',
                  fontSize:'12px',cursor:'pointer',
                }}>{editingFlight ? 'Cancel' : myMember ? 'Edit mine' : 'Set mine'}</button>
              </div>

              {editingFlight && (
                <div style={{marginBottom:'14px',padding:'14px',background:'rgba(255,255,255,0.03)',borderRadius:'8px',border:'0.5px solid rgba(255,255,255,0.08)'}}>
                  <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',marginBottom:'10px',fontWeight:500}}>Your flight preferences</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                    <div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Home airport (e.g. DEN)</div>
                      <input
                        value={flightLimit.home_airport}
                        onChange={e=>setFlightLimit(f=>({...f,home_airport:e.target.value.toUpperCase()}))}
                        placeholder="DEN"
                        maxLength={3}
                        style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'0.5px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
                      />
                    </div>
                    <div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Max flight hours (optional)</div>
                      <input
                        type="number"
                        value={flightLimit.max_flight_hours}
                        onChange={e=>setFlightLimit(f=>({...f,max_flight_hours:e.target.value}))}
                        placeholder="e.g. 6"
                        style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'0.5px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
                      />
                    </div>
                  </div>
                  <button onClick={saveFlightLimit} style={{
                    background:'#FFD166',color:'#1a0e00',border:'none',
                    borderRadius:'8px',padding:'8px 20px',fontSize:'13px',
                    fontWeight:700,cursor:'pointer',
                  }}>Save</button>
                </div>
              )}

              {members.length === 0 ? (
                <div style={{fontSize:'13px',color:'rgba(255,255,255,0.3)'}}>
                  No members have set their flight preferences yet.
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {members.map(m=>(
                    <div key={m.id} style={{
                      display:'flex',alignItems:'center',justifyContent:'space-between',
                      padding:'8px 12px',borderRadius:'8px',background:'rgba(255,255,255,0.03)',
                    }}>
                      <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>
                        {m.email} {m.home_airport && <span style={{color:'#FFD166',fontSize:'12px'}}>({m.home_airport})</span>}
                      </div>
                      <div style={{fontSize:'13px',color:m.max_flight_hours?'#5DCAA5':'rgba(255,255,255,0.3)'}}>
                        {m.max_flight_hours ? `Max ${m.max_flight_hours}h` : 'No limit'}
                      </div>
                    </div>
                  ))}
                  {effectiveMaxFlight && (
                    <div style={{
                      marginTop:'6px',padding:'8px 12px',borderRadius:'8px',
                      background:'rgba(255,209,102,0.08)',border:'0.5px solid rgba(255,209,102,0.2)',
                      fontSize:'12px',color:'#FFD166',
                    }}>
                      ✈️ Effective group max: {effectiveMaxFlight}h (most restrictive member)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PITCHES */}
            <div style={{
              background:'rgba(255,255,255,0.04)',
              border:'0.5px solid rgba(255,255,255,0.08)',
              borderRadius:'12px',padding:'20px 24px',
            }}>
              <div style={{fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'14px'}}>
                Vacation pitches · 0
              </div>
              <button style={{
                width:'100%',padding:'16px',borderRadius:'10px',
                border:'1px dashed rgba(255,255,255,0.12)',
                background:'none',color:'rgba(255,255,255,0.4)',
                fontSize:'14px',cursor:'pointer',
              }}>
                + Pitch a destination
              </button>
            </div>

          </div>

          {/* RANKING PANEL */}
          <div style={{
            background:'#0f0f13',
            border:'0.5px solid rgba(255,255,255,0.08)',
            borderRadius:'12px',padding:'20px',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
              <span style={{fontSize:'16px'}}>🏆</span>
              <div style={{fontSize:'15px',fontWeight:600,color:'#fff'}}>Group ranking</div>
            </div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'24px 0'}}>
              No pitches yet — rankings appear here once your group starts pitching destinations.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}