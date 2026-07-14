'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { getSafeUser, safeRedirect } from '../../lib/authGuard'
import EgoForm from '../../components/EgoForm'

const BLANK_EGO = {
  display_name: '',
  avatar_url: null,
  max_flight_hours: '',
  budget_min: '',
  budget_max: '',
  budget_flexible: true,
  vibe_tags: [],
  climate_prefs: [],
  travel_pace: 'moderate',
}

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)

  // account
  const [account, setAccount] = useState({ home_airport: '', passport_holder: true })
  const [accountAvatarUrl, setAccountAvatarUrl] = useState(null)
  const [savingAccount, setSavingAccount] = useState(false)
  const [savedAccount, setSavedAccount] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // egos
  const [egos, setEgos] = useState([])
  const [openEgoId, setOpenEgoId] = useState(null) // an ego id, 'new', or null
  const [egoForm, setEgoForm] = useState(BLANK_EGO)
  const [savingEgo, setSavingEgo] = useState(false)
  const [egoUploading, setEgoUploading] = useState(false)
  const egoFileInputRef = useRef(null)

  useEffect(() => { init() }, [])

  async function init() {
    const safeUser = await getSafeUser()
    if (!safeUser) {
      if (!safeRedirect('/auth')) setAuthFailed(true)
      return
    }
    setUser(safeUser)
    await Promise.all([loadAccount(safeUser.id), loadEgos(safeUser.id)])
    setLoading(false)
  }

  async function loadAccount(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
    if (data) {
      setAccount({
        home_airport: data.home_airport || '',
        passport_holder: data.passport_holder ?? true,
      })
      if (data.avatar_url) setAccountAvatarUrl(data.avatar_url)
    }
  }

  async function loadEgos(userId) {
    const { data } = await supabase.from('personalities').select('*').eq('user_id', userId).order('created_at', { ascending: true })
    if (data) setEgos(data)
  }

  async function uploadAccountAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    await doAvatarUpload(file, `${user.id}`, async (publicUrl) => {
      setAccountAvatarUrl(publicUrl + '?t=' + Date.now())
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id)
    }, setUploading)
  }

  async function uploadEgoAvatar(event) {
    const file = event.target.files?.[0]
    if (!file || !openEgoId || openEgoId === 'new') return
    await doAvatarUpload(file, `${user.id}-ego-${openEgoId}`, async (publicUrl) => {
      const stamped = publicUrl + '?t=' + Date.now()
      setEgoForm(f => ({ ...f, avatar_url: stamped }))
      await supabase.from('personalities').update({ avatar_url: publicUrl }).eq('id', openEgoId)
      setEgos(list => list.map(e => e.id === openEgoId ? { ...e, avatar_url: stamped } : e))
    }, setEgoUploading)
  }

  async function doAvatarUpload(file, baseName, onDone, setBusy) {
    setBusy(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${baseName}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await onDone(publicUrl)
    }
    setBusy(false)
  }

  async function handlePaste(event) {
    const items = event.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        if (openEgoId && openEgoId !== 'new') {
          setEgoUploading(true)
          const fileName = `${user.id}-ego-${openEgoId}.png`
          const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true, contentType: 'image/png' })
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
            const stamped = publicUrl + '?t=' + Date.now()
            setEgoForm(f => ({ ...f, avatar_url: stamped }))
            await supabase.from('personalities').update({ avatar_url: publicUrl }).eq('id', openEgoId)
            setEgos(list => list.map(e => e.id === openEgoId ? { ...e, avatar_url: stamped } : e))
          }
          setEgoUploading(false)
        } else {
          setUploading(true)
          const fileName = `${user.id}.png`
          const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true, contentType: 'image/png' })
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
            setAccountAvatarUrl(publicUrl + '?t=' + Date.now())
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id)
          }
          setUploading(false)
        }
      }
    }
  }

  async function saveAccount() {
    setSavingAccount(true)
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      home_airport: account.home_airport || null,
      passport_holder: account.passport_holder,
      avatar_url: accountAvatarUrl ? accountAvatarUrl.split('?')[0] : null,
    }, { onConflict: 'user_id' })
    setSavingAccount(false)
    if (!error) { setSavedAccount(true); setTimeout(() => { window.location.href = '/dashboard' }, 700) }
  }

  function openEgo(ego) {
    setOpenEgoId(ego.id)
    setEgoForm({
      display_name: ego.display_name || '',
      avatar_url: ego.avatar_url || null,
      max_flight_hours: ego.max_flight_hours || '',
      budget_min: ego.budget_min || '',
      budget_max: ego.budget_max || '',
      budget_flexible: ego.budget_flexible ?? true,
      vibe_tags: ego.vibe_tags || [],
      climate_prefs: ego.climate_prefs || [],
      travel_pace: ego.travel_pace || 'moderate',
    })
  }

  function openNewEgo() {
    setOpenEgoId('new')
    setEgoForm(BLANK_EGO)
  }

  function closeEgo() {
    setOpenEgoId(null)
    setEgoForm(BLANK_EGO)
  }

  async function saveEgo() {
    if (!egoForm.display_name.trim()) return
    setSavingEgo(true)
    const payload = {
      display_name: egoForm.display_name.trim(),
      max_flight_hours: egoForm.max_flight_hours || null,
      budget_min: egoForm.budget_min || null,
      budget_max: egoForm.budget_max || null,
      budget_flexible: egoForm.budget_flexible,
      vibe_tags: egoForm.vibe_tags,
      climate_prefs: egoForm.climate_prefs,
      travel_pace: egoForm.travel_pace,
    }
    if (openEgoId === 'new') {
      await supabase.from('personalities').insert({ user_id: user.id, ...payload })
    } else {
      await supabase.from('personalities').update(payload).eq('id', openEgoId)
    }
    setSavingEgo(false)
    await loadEgos(user.id)
    closeEgo()
  }

  async function deleteEgo(ego) {
    const { data: inUse } = await supabase.from('group_members').select('id').eq('personality_id', ego.id).limit(1)
    if (inUse && inUse.length > 0) {
      alert(`"${ego.display_name}" is currently representing you on a vacation. Switch that vacation to a different ego first (from the vacation page), then you can delete this one.`)
      return
    }
    if (!confirm(`Delete the ego "${ego.display_name}"? This can't be undone.`)) return
    await supabase.from('personalities').delete().eq('id', ego.id)
    if (openEgoId === ego.id) closeEgo()
    await loadEgos(user.id)
  }

  function toggleEgoVibe(tag) {
    setEgoForm(f => ({ ...f, vibe_tags: f.vibe_tags.includes(tag) ? f.vibe_tags.filter(v => v !== tag) : [...f.vibe_tags, tag] }))
  }

  function toggleEgoClimate(val) {
    setEgoForm(f => ({ ...f, climate_prefs: f.climate_prefs.includes(val) ? f.climate_prefs.filter(v => v !== val) : [...f.climate_prefs, val] }))
  }

  function manualSignIn() {
    try { sessionStorage.removeItem('cw_redirects') } catch (e) {}
    supabase.auth.signOut().finally(() => { window.location.href = '/auth' })
  }

  const inputStyle = {
    width:'100%',padding:'10px 14px',borderRadius:'8px',
    border:'0.5px solid rgba(255,255,255,0.15)',
    background:'rgba(255,255,255,0.07)',color:'#fff',
    fontSize:'14px',outline:'none',boxSizing:'border-box',
  }

  const cardStyle = {
    background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',
    borderRadius:'12px',padding:'20px 24px',marginBottom:'16px',
  }

  const labelStyle = { fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'16px' }

  if (loading) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        {authFailed ? (
          <div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:'15px',marginBottom:'14px'}}>Your session needs a refresh.</div>
            <button onClick={manualSignIn} style={{background:'#FFD166',color:'#1a0e00',border:'none',borderRadius:'8px',padding:'10px 22px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>Sign in</button>
          </div>
        ) : (
          <div style={{color:'rgba(255,255,255,0.4)'}}>Loading...</div>
        )}
      </div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',fontFamily:'sans-serif'}} onPaste={handlePaste}>
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
          <h1 style={{fontSize:'28px',fontWeight:700,color:'#fff',margin:'0 0 8px'}}>Your account</h1>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:'15px',margin:0}}>
            Facts that stay true no matter which trip you're planning.
          </p>
        </div>

        {/* ACCOUNT AVATAR */}
        <div style={cardStyle}>
          <div style={labelStyle}>Profile picture</div>
          <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
            <div
              onClick={()=>fileInputRef.current?.click()}
              style={{
                width:'80px',height:'80px',borderRadius:'50%',
                background: accountAvatarUrl ? `url(${accountAvatarUrl}) center/cover` : 'rgba(255,255,255,0.08)',
                border:'2px solid rgba(255,255,255,0.12)',
                display:'flex',alignItems:'center',justifyContent:'center',
                cursor:'pointer',transition:'border-color 0.15s',flexShrink:0,
                overflow:'hidden',
              }}
              onMouseOver={e=>e.currentTarget.style.borderColor='rgba(255,209,102,0.5)'}
              onMouseOut={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'}
            >
              {!accountAvatarUrl && !uploading && <span style={{fontSize:'28px',color:'rgba(255,255,255,0.25)'}}>+</span>}
              {uploading && <span style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>...</span>}
            </div>
            <div>
              <button onClick={()=>fileInputRef.current?.click()} style={{
                background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.15)',
                borderRadius:'8px',padding:'8px 16px',color:'rgba(255,255,255,0.6)',
                fontSize:'13px',cursor:'pointer',marginBottom:'6px',display:'block',
              }}>
                {accountAvatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.25)'}}>
                This is your default photo — each alter ego can use its own instead. Click to upload or press Ctrl+V to paste.
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAccountAvatar} style={{display:'none'}} />
          </div>
        </div>

        {/* BASICS */}
        <div style={cardStyle}>
          <div style={labelStyle}>Basics</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
            <div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Home airport</div>
              <input value={account.home_airport} onChange={e=>setAccount(a=>({...a,home_airport:e.target.value.toUpperCase()}))}
                placeholder="DEN" maxLength={3} style={inputStyle} />
            </div>
            <div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Passport holder?</div>
              <div style={{display:'flex',gap:'8px'}}>
                {['Yes','No'].map(opt=>(
                  <button key={opt} onClick={()=>setAccount(a=>({...a,passport_holder:opt==='Yes'}))} style={{
                    flex:1,padding:'10px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontWeight:500,
                    background:(opt==='Yes'&&account.passport_holder)||(opt==='No'&&!account.passport_holder)?'rgba(255,209,102,0.15)':'rgba(255,255,255,0.05)',
                    border:(opt==='Yes'&&account.passport_holder)||(opt==='No'&&!account.passport_holder)?'0.5px solid rgba(255,209,102,0.4)':'0.5px solid rgba(255,255,255,0.1)',
                    color:(opt==='Yes'&&account.passport_holder)||(opt==='No'&&!account.passport_holder)?'#FFD166':'rgba(255,255,255,0.4)',
                  }}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button onClick={saveAccount} disabled={savingAccount} style={{
          width:'100%',padding:'14px',borderRadius:'10px',
          background: savedAccount ? 'rgba(29,158,117,0.2)' : '#FFD166',
          border: savedAccount ? '0.5px solid rgba(29,158,117,0.4)' : 'none',
          color: savedAccount ? '#5DCAA5' : '#1a0e00',
          fontSize:'15px',fontWeight:700,cursor:'pointer',marginBottom:'48px',
        }}>
          {savingAccount ? 'Saving...' : savedAccount ? '✓ Saved!' : 'Save account'}
        </button>

        {/* ALTER EGOS */}
        <div style={{marginBottom:'20px'}}>
          <h2 style={{fontSize:'22px',fontWeight:700,color:'#fff',margin:'0 0 8px'}}>Your alter egos</h2>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:'14px',margin:0}}>
            Different personas for different trips — budget, vibe, and pace can vary per ego. Your first vacation uses one automatically; you'll get to pick or create one when you join or start a second vacation.
          </p>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'16px'}}>
          {egos.map(ego => (
            <div key={ego.id} style={{background:'rgba(255,255,255,0.04)',border: openEgoId===ego.id ? '0.5px solid rgba(255,209,102,0.4)' : '0.5px solid rgba(255,255,255,0.08)',borderRadius:'12px',overflow:'hidden'}}>
              <div style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:'14px',cursor:'pointer'}} onClick={()=> openEgoId===ego.id ? closeEgo() : openEgo(ego)}>
                <div style={{
                  width:'44px',height:'44px',borderRadius:'50%',flexShrink:0,
                  background: (ego.avatar_url || accountAvatarUrl) ? `url(${ego.avatar_url || accountAvatarUrl}) center/cover` : 'rgba(255,255,255,0.1)',
                  border:'1.5px solid rgba(255,255,255,0.15)',
                }} />
                <div style={{flex:1}}>
                  <div style={{fontSize:'15px',fontWeight:600,color:'#fff'}}>{ego.display_name}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginTop:'4px'}}>
                    {(ego.vibe_tags||[]).slice(0,4).map(tag=>(
                      <span key={tag} style={{fontSize:'11px',color:'#5DCAA5',background:'rgba(29,158,117,0.12)',border:'0.5px solid rgba(29,158,117,0.3)',borderRadius:'20px',padding:'2px 8px'}}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span style={{color:'rgba(255,255,255,0.3)',fontSize:'13px'}}>{openEgoId===ego.id ? 'Close' : 'Edit'}</span>
              </div>

              {openEgoId === ego.id && (
                <div style={{padding:'0 20px 20px'}}>
                  <EgoForm
                    egoForm={egoForm} setEgoForm={setEgoForm}
                    toggleVibe={toggleEgoVibe} toggleClimate={toggleEgoClimate}
                    inputStyle={inputStyle}
                    avatarUrl={egoForm.avatar_url || accountAvatarUrl}
                    onAvatarClick={()=>egoFileInputRef.current?.click()}
                    uploading={egoUploading}
                    canCustomizePhoto
                  />
                  <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
                    <button onClick={()=>deleteEgo(ego)} style={{background:'rgba(216,90,48,0.1)',border:'0.5px solid rgba(216,90,48,0.3)',borderRadius:'8px',padding:'10px 18px',color:'#F0997B',fontSize:'13px',cursor:'pointer'}}>Delete</button>
                    <div style={{flex:1}} />
                    <button onClick={closeEgo} style={{background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:'8px',padding:'10px 18px',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
                    <button onClick={saveEgo} disabled={savingEgo} style={{background:'#FFD166',border:'none',borderRadius:'8px',padding:'10px 20px',color:'#1a0e00',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>{savingEgo ? 'Saving...' : 'Save ego'}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {openEgoId === 'new' ? (
          <div style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,209,102,0.4)',borderRadius:'12px',padding:'20px',marginBottom:'40px'}}>
            <div style={{fontSize:'14px',fontWeight:600,color:'#fff',marginBottom:'14px'}}>New alter ego</div>
            <EgoForm
              egoForm={egoForm} setEgoForm={setEgoForm}
              toggleVibe={toggleEgoVibe} toggleClimate={toggleEgoClimate}
              inputStyle={inputStyle}
              avatarUrl={accountAvatarUrl}
              canCustomizePhoto={false}
            />
            <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
              <div style={{flex:1}} />
              <button onClick={closeEgo} style={{background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:'8px',padding:'10px 18px',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
              <button onClick={saveEgo} disabled={savingEgo} style={{background:'#FFD166',border:'none',borderRadius:'8px',padding:'10px 20px',color:'#1a0e00',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>{savingEgo ? 'Saving...' : 'Create ego'}</button>
            </div>
          </div>
        ) : (
          <button onClick={openNewEgo} style={{width:'100%',padding:'16px',borderRadius:'12px',border:'1px dashed rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.5)',fontSize:'14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'40px'}}>
            <span style={{fontSize:'18px'}}>+</span>Create new ego
          </button>
        )}

        <input ref={egoFileInputRef} type="file" accept="image/*" onChange={uploadEgoAvatar} style={{display:'none'}} />
      </div>
    </main>
  )
}
