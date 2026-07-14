'use client'
import { VIBE_OPTIONS, CLIMATE_OPTIONS, PACE_OPTIONS } from '../lib/tripOptions'

export default function EgoForm({ egoForm, setEgoForm, toggleVibe, toggleClimate, inputStyle, avatarUrl, onAvatarClick, uploading, canCustomizePhoto }) {
  return (
    <div>
      {canCustomizePhoto ? (
        <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'16px'}}>
          <div onClick={onAvatarClick} style={{
            width:'56px',height:'56px',borderRadius:'50%',flexShrink:0,cursor:'pointer',
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'rgba(255,255,255,0.08)',
            border:'2px solid rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            {uploading && <span style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>...</span>}
          </div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>Click to give this ego its own photo (defaults to your account photo). Ctrl+V works too, while this ego is open.</div>
        </div>
      ) : (
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'16px'}}>Uses your account photo by default — you can give this ego its own photo after creating it.</div>
      )}

      <div style={{marginBottom:'14px'}}>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Display name</div>
        <input value={egoForm.display_name} onChange={e=>setEgoForm(f=>({...f,display_name:e.target.value}))}
          placeholder="e.g. Beach Harrison" style={inputStyle} />
      </div>

      <div style={{marginBottom:'14px'}}>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Max flight hours</div>
        <input type="number" value={egoForm.max_flight_hours}
          onChange={e=>setEgoForm(f=>({...f,max_flight_hours:e.target.value}))}
          placeholder="Leave blank for no limit" style={inputStyle} />
      </div>

      <div style={{marginBottom:'14px'}}>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>Budget</div>
        <div style={{display:'flex',gap:'8px',marginBottom: egoForm.budget_flexible ? 0 : '10px'}}>
          <button onClick={()=>setEgoForm(f=>({...f,budget_flexible:true}))} style={{
            flex:1,padding:'10px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',
            background:egoForm.budget_flexible?'rgba(255,209,102,0.15)':'rgba(255,255,255,0.05)',
            border:egoForm.budget_flexible?'0.5px solid rgba(255,209,102,0.4)':'0.5px solid rgba(255,255,255,0.1)',
            color:egoForm.budget_flexible?'#FFD166':'rgba(255,255,255,0.4)',
          }}>Flexible</button>
          <button onClick={()=>setEgoForm(f=>({...f,budget_flexible:false}))} style={{
            flex:1,padding:'10px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',
            background:!egoForm.budget_flexible?'rgba(255,209,102,0.15)':'rgba(255,255,255,0.05)',
            border:!egoForm.budget_flexible?'0.5px solid rgba(255,209,102,0.4)':'0.5px solid rgba(255,255,255,0.1)',
            color:!egoForm.budget_flexible?'#FFD166':'rgba(255,255,255,0.4)',
          }}>Set a range</button>
        </div>
        {!egoForm.budget_flexible && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <input type="number" value={egoForm.budget_min} onChange={e=>setEgoForm(f=>({...f,budget_min:e.target.value}))} placeholder="Min $" style={inputStyle} />
            <input type="number" value={egoForm.budget_max} onChange={e=>setEgoForm(f=>({...f,budget_max:e.target.value}))} placeholder="Max $" style={inputStyle} />
          </div>
        )}
      </div>

      <div style={{marginBottom:'14px'}}>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>Preferred climate</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
          {CLIMATE_OPTIONS.map(opt=>(
            <button key={opt.value} onClick={()=>toggleClimate(opt.value)} style={{
              padding:'8px 12px',borderRadius:'8px',fontSize:'12px',cursor:'pointer',textAlign:'left',
              background: egoForm.climate_prefs.includes(opt.value) ? 'rgba(55,138,221,0.15)' : 'rgba(255,255,255,0.04)',
              border: egoForm.climate_prefs.includes(opt.value) ? '0.5px solid rgba(55,138,221,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
              color: egoForm.climate_prefs.includes(opt.value) ? '#7ec8f5' : 'rgba(255,255,255,0.5)',
            }}>{opt.label}</button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:'14px'}}>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>Travel pace</div>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {PACE_OPTIONS.map(opt=>(
            <button key={opt.value} onClick={()=>setEgoForm(f=>({...f,travel_pace:opt.value}))} style={{
              padding:'8px 14px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',textAlign:'left',
              background:egoForm.travel_pace===opt.value?'rgba(255,209,102,0.12)':'rgba(255,255,255,0.04)',
              border:egoForm.travel_pace===opt.value?'0.5px solid rgba(255,209,102,0.4)':'0.5px solid rgba(255,255,255,0.08)',
              color:egoForm.travel_pace===opt.value?'#FFD166':'rgba(255,255,255,0.5)',
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
              background:egoForm.vibe_tags.includes(tag)?'rgba(29,158,117,0.2)':'rgba(255,255,255,0.05)',
              border:egoForm.vibe_tags.includes(tag)?'0.5px solid rgba(29,158,117,0.4)':'0.5px solid rgba(255,255,255,0.1)',
              color:egoForm.vibe_tags.includes(tag)?'#5DCAA5':'rgba(255,255,255,0.4)',
            }}>{tag}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
