'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'

export default function GroupPage() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) window.location.href = '/auth'
      else { setUser(user); loadGroup() }
    })
  }, [])

  async function loadGroup() {
    const { data, error } = await supabase.from('groups').select('*').eq('id', id).single()
    console.log('group:', data, error)
    if (data) setGroup(data)
    setLoading(false)
  }

  function copyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${group.invite_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
            <div style={{
              background:'rgba(255,255,255,0.04)',
              border:'0.5px solid rgba(255,255,255,0.08)',
              borderRadius:'12px',padding:'20px 24px',marginBottom:'16px',
            }}>
              <div style={{fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.3)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'14px'}}>
                Group target
              </div>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:'14px'}}>
                No target set yet. Set a budget, travel dates, and vibe so everyone knows what you're aiming for.
              </div>
              <button style={{
                marginTop:'14px',background:'rgba(255,209,102,0.1)',
                border:'0.5px solid rgba(255,209,102,0.3)',
                borderRadius:'8px',padding:'8px 16px',
                color:'#FFD166',fontSize:'13px',cursor:'pointer',
              }}>+ Set group target</button>
            </div>

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