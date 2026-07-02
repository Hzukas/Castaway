'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setMessage('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else window.location.href = '/dashboard'
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d1f2d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{textAlign:'center', marginBottom:'2rem'}}>
          <div style={{fontSize:'13px', color:'#FFD166', fontWeight:600, letterSpacing:'0.1em', marginBottom:'8px'}}>CASTAWAY</div>
          <h1 style={{color:'#fff', fontSize:'24px', fontWeight:700, margin:0}}>{isLogin ? 'Welcome back' : 'Create account'}</h1>
          <p style={{color:'rgba(255,255,255,0.4)', fontSize:'14px', marginTop:'8px'}}>
            {isLogin ? 'Sign in to your group' : 'Start planning together'}
          </p>
        </div>

        <div style={{marginBottom:'16px'}}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width:'100%', padding:'12px 14px', borderRadius:'10px',
              border:'0.5px solid rgba(255,255,255,0.15)',
              background:'rgba(255,255,255,0.07)', color:'#fff',
              fontSize:'14px', outline:'none', boxSizing:'border-box',
            }}
          />
        </div>

        <div style={{marginBottom:'24px'}}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width:'100%', padding:'12px 14px', borderRadius:'10px',
              border:'0.5px solid rgba(255,255,255,0.15)',
              background:'rgba(255,255,255,0.07)', color:'#fff',
              fontSize:'14px', outline:'none', boxSizing:'border-box',
            }}
          />
        </div>

        {message && (
          <div style={{
            background:'rgba(255,209,102,0.1)', border:'0.5px solid rgba(255,209,102,0.3)',
            borderRadius:'8px', padding:'10px 14px', marginBottom:'16px',
            color:'#FFD166', fontSize:'13px',
          }}>{message}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width:'100%', padding:'13px', borderRadius:'10px',
            background:'#FFD166', color:'#1a0e00', border:'none',
            fontSize:'15px', fontWeight:700, cursor:'pointer',
          }}
        >{loading ? 'Loading...' : isLogin ? 'Sign in' : 'Create account'}</button>

        <div style={{textAlign:'center', marginTop:'20px'}}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'13px', cursor:'pointer'}}
          >{isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}</button>
        </div>
      </div>
    </main>
  )
}