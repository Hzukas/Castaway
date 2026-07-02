'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const NAME_IDEAS = [
  'Captain Sandy Toes', 'The Beach Whisperer', 'Passport Ninja',
  'Sir Snacks-a-Lot', 'Vacation Mode: ON', 'Chief Adventure Officer',
]

export default function Onboarding() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [placeholder, setPlaceholder] = useState(NAME_IDEAS[0])
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/auth'; return }
      setUser(user)
      setLoading(false)
    })
    setPlaceholder(NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)])
  }, [])

  function goNext() {
    const joinCode = localStorage.getItem('joinAfterAuth')
    if (joinCode) {
      localStorage.removeItem('joinAfterAuth')
      window.location.href = `/join/${joinCode}`
    } else {
      window.location.href = '/dashboard'
    }
  }

  async function handleContinue() {
    if (!name.trim()) {
      setError('Give yourself a name — even a silly one works!')
      return
    }
    setSaving(true)
    const { error: dbError } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: name.trim(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    if (dbError) { setError('Something went wrong, try again.'); return }
    goNext()
  }

  if (loading) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif'}}>Loading...</div>
    </main>
  )

  return (
    <main style={{
      minHeight: '100vh', background: '#0d1f2d', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} xmlns="http://www.w3.org/2000/svg">
        {[0,1,2,3,4,5,6,7,8].map(i=>(
          <line key={`h${i}`} x1="0" y1={`${i*12.5}%`} x2="100%" y2={`${i*12.5}%`} stroke="#378ADD" strokeWidth="0.5" strokeOpacity={i%2===0?0.1:0.05}/>
        ))}
        <path d="M 80,400 Q 400,-100 800,300" stroke="#FFD166" strokeWidth="1.5" strokeDasharray="6 6" fill="none" strokeOpacity="0.5"/>
        <circle cx="80" cy="400" r="4" fill="#FFD166" fillOpacity="0.7"/>
        <circle cx="800" cy="300" r="4" fill="#FFD166" fillOpacity="0.7"/>
      </svg>

      <div style={{
        position:'relative', zIndex:1,
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '440px',
      }}>
        <div style={{textAlign:'center', marginBottom:'1.75rem'}}>
          <div style={{fontSize:'40px', marginBottom:'12px'}}>🏝️</div>
          <div style={{fontSize:'13px', color:'#FFD166', fontWeight:600, letterSpacing:'0.1em', marginBottom:'10px'}}>WELCOME TO CASTAWAY</div>
          <h1 style={{color:'#fff', fontSize:'24px', fontWeight:700, margin:'0 0 10px', lineHeight:1.3}}>
            First things first — what should we call you?
          </h1>
          <p style={{color:'rgba(255,255,255,0.45)', fontSize:'14px', margin:0, lineHeight:1.5}}>
            This is your vacation alter-ego. Make it fun — it's what your group will see on every pitch and vote.
          </p>
        </div>

        <input
          value={name}
          onChange={e=>{setName(e.target.value); setError('')}}
          onKeyDown={e=>e.key==='Enter' && handleContinue()}
          placeholder={placeholder}
          autoFocus
          style={{
            width:'100%', padding:'14px 16px', borderRadius:'10px',
            border: error ? '0.5px solid rgba(216,90,48,0.5)' : '0.5px solid rgba(255,255,255,0.15)',
            background:'rgba(255,255,255,0.07)', color:'#fff',
            fontSize:'16px', outline:'none', boxSizing:'border-box',
            textAlign:'center', fontWeight:500,
            marginBottom: error ? '8px' : '20px',
          }}
        />

        {error && (
          <div style={{color:'#F0997B', fontSize:'12px', textAlign:'center', marginBottom:'16px'}}>
            {error}
          </div>
        )}

        <button onClick={handleContinue} disabled={saving} style={{
          width:'100%', padding:'14px', borderRadius:'10px',
          background:'#FFD166', color:'#1a0e00', border:'none',
          fontSize:'15px', fontWeight:700, cursor:'pointer',
        }}>
          {saving ? 'Saving...' : "Let's go →"}
        </button>

        <div style={{textAlign:'center', marginTop:'16px'}}>
          <span style={{fontSize:'12px', color:'rgba(255,255,255,0.25)'}}>
            You can fill out the rest of your profile — budget, flight limits, vibe — anytime later.
          </span>
        </div>
      </div>
    </main>
  )
}