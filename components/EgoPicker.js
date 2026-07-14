'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import EgoForm from './EgoForm'

const BLANK_EGO = {
  display_name: '',
  max_flight_hours: '',
  budget_min: '',
  budget_max: '',
  budget_flexible: true,
  vibe_tags: [],
  climate_prefs: [],
  travel_pace: 'moderate',
}

// Shown when a user creates or joins their 2nd+ group — lets them reuse an
// existing alter ego or spin up a new one, and reports back a personality_id.
export default function EgoPicker({ userId, personalities, accountAvatarUrl, onConfirm, onCancel }) {
  const [mode, setMode] = useState('pick') // 'pick' | 'create'
  const [selectedId, setSelectedId] = useState(personalities[0]?.id || null)
  const [egoForm, setEgoForm] = useState(BLANK_EGO)
  const [busy, setBusy] = useState(false)

  function toggleVibe(tag) {
    setEgoForm(f => ({ ...f, vibe_tags: f.vibe_tags.includes(tag) ? f.vibe_tags.filter(v => v !== tag) : [...f.vibe_tags, tag] }))
  }
  function toggleClimate(val) {
    setEgoForm(f => ({ ...f, climate_prefs: f.climate_prefs.includes(val) ? f.climate_prefs.filter(v => v !== val) : [...f.climate_prefs, val] }))
  }

  async function confirm() {
    if (mode === 'pick') {
      if (!selectedId) return
      onConfirm(selectedId)
      return
    }
    if (!egoForm.display_name.trim()) return
    setBusy(true)
    const { data, error } = await supabase.from('personalities').insert({
      user_id: userId,
      display_name: egoForm.display_name.trim(),
      max_flight_hours: egoForm.max_flight_hours || null,
      budget_min: egoForm.budget_min || null,
      budget_max: egoForm.budget_max || null,
      budget_flexible: egoForm.budget_flexible,
      vibe_tags: egoForm.vibe_tags,
      climate_prefs: egoForm.climate_prefs,
      travel_pace: egoForm.travel_pace,
    }).select().single()
    setBusy(false)
    if (!error && data) onConfirm(data.id)
  }

  const inputStyle = {
    width:'100%',padding:'10px 14px',borderRadius:'8px',
    border:'0.5px solid rgba(255,255,255,0.15)',
    background:'rgba(255,255,255,0.07)',color:'#fff',
    fontSize:'14px',outline:'none',boxSizing:'border-box',
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'24px'}}>
      <div style={{background:'#0d1f2d',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:'16px',padding:'28px',width:'100%',maxWidth:'440px',maxHeight:'85vh',overflowY:'auto'}}>
        <div style={{fontSize:'13px',color:'#FFD166',fontWeight:600,letterSpacing:'0.08em',marginBottom:'6px'}}>ALTER EGO</div>
        <h2 style={{color:'#fff',fontSize:'19px',fontWeight:700,margin:'0 0 8px'}}>Which version of you is going on this trip?</h2>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:'13px',margin:'0 0 20px'}}>Pick an existing ego or create a new one for this group.</p>

        {mode === 'pick' ? (
          <>
            <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
              {personalities.map(ego => (
                <div key={ego.id} onClick={()=>setSelectedId(ego.id)} style={{
                  display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'10px',cursor:'pointer',
                  background: selectedId===ego.id ? 'rgba(255,209,102,0.1)' : 'rgba(255,255,255,0.04)',
                  border: selectedId===ego.id ? '0.5px solid rgba(255,209,102,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{
                    width:'36px',height:'36px',borderRadius:'50%',flexShrink:0,
                    background: (ego.avatar_url || accountAvatarUrl) ? `url(${ego.avatar_url || accountAvatarUrl}) center/cover` : 'rgba(255,255,255,0.1)',
                    border:'1.5px solid rgba(255,255,255,0.15)',
                  }} />
                  <div style={{flex:1,fontSize:'14px',fontWeight:600,color:'#fff'}}>{ego.display_name}</div>
                  {selectedId===ego.id && <span style={{color:'#FFD166',fontSize:'16px'}}>✓</span>}
                </div>
              ))}
            </div>
            <button onClick={()=>setMode('create')} style={{
              width:'100%',padding:'12px',borderRadius:'10px',border:'1px dashed rgba(255,255,255,0.15)',
              background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer',marginBottom:'20px',
            }}>+ Create a new ego</button>
          </>
        ) : (
          <div style={{marginBottom:'20px'}}>
            <EgoForm
              egoForm={egoForm} setEgoForm={setEgoForm}
              toggleVibe={toggleVibe} toggleClimate={toggleClimate}
              inputStyle={inputStyle}
              canCustomizePhoto={false}
            />
            {personalities.length > 0 && (
              <button onClick={()=>setMode('pick')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:'12px',cursor:'pointer',marginTop:'12px',padding:0}}>← Back to existing egos</button>
            )}
          </div>
        )}

        <div style={{display:'flex',gap:'8px'}}>
          {onCancel && (
            <button onClick={onCancel} style={{flex:1,padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.5)',fontSize:'14px',cursor:'pointer'}}>Cancel</button>
          )}
          <button onClick={confirm} disabled={busy || (mode==='pick' && !selectedId) || (mode==='create' && !egoForm.display_name.trim())} style={{
            flex:2,padding:'12px',borderRadius:'10px',background:'#FFD166',border:'none',color:'#1a0e00',fontSize:'14px',fontWeight:700,cursor:'pointer',
          }}>{busy ? 'Creating...' : mode === 'create' ? 'Create & continue' : 'Continue'}</button>
        </div>
      </div>
    </div>
  )
}
