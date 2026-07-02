'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) window.location.href = '/auth'
      else { setUser(user); loadGroups(user.id); setLoading(false) }
    })
  }, [])

  async function loadGroups(userId) {
    const { data, error } = await supabase.from('groups').select('*').eq('created_by', userId)
    console.log('groups:', data, error)
    if (data) setGroups(data)
  }

  async function createGroup() {
    if (!groupName.trim()) return
    setCreating(true)
    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await supabase.from('groups').insert({
      name: groupName.trim(),
      invite_code,
      created_by: user.id,
    }).select()
    console.log('created:', data, error)
    if (data) {
      setGroups([...groups, data[0]])
      setGroupName('')
      setShowCreate(false)
    }
    setCreating(false)
  }

  function copyInviteLink(code) {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`)
    setCopiedId(code)
    setTimeout(() => setCopiedId(null), 2000)
  }

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
        <div style={{fontSize:'18px',fontWeight:700,color:'#FFD166',letterSpacing:'0.05em'}}>CASTAWAY</div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <span style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>{user.email}</span>
          <button onClick={()=>supabase.auth.signOut().then(()=>window.location.href='/auth')}
            style={{background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.12)',
            borderRadius:'8px',padding:'6px 14px',color:'rgba(255,255,255,0.6)',fontSize:'13px',cursor:'pointer'}}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{maxWidth:'800px',margin:'0 auto',padding:'48px 24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'32px'}}>
          <div>
            <h1 style={{fontSize:'28px',fontWeight:700,color:'#fff',margin:'0 0 8px'}}>Your groups</h1>
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:'15px',margin:0}}>
              Create a group and invite your people to plan together.
            </p>
          </div>
          <button onClick={()=>setShowCreate(!showCreate)} style={{
            background:'#FFD166',color:'#1a0e00',border:'none',borderRadius:'10px',
            padding:'10px 20px',fontSize:'14px',fontWeight:700,cursor:'pointer',
          }}>+ New group</button>
        </div>

        {showCreate && (
          <div style={{
            background:'rgba(255,255,255,0.05)',border:'0.5px solid rgba(255,255,255,0.12)',
            borderRadius:'12px',padding:'20px',marginBottom:'24px',
          }}>
            <div style={{fontSize:'14px',fontWeight:600,color:'#fff',marginBottom:'12px'}}>Name your group</div>
            <div style={{display:'flex',gap:'10px'}}>
              <input
                value={groupName}
                onChange={e=>setGroupName(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&createGroup()}
                placeholder="e.g. Johnson family trip"
                style={{
                  flex:1,padding:'10px 14px',borderRadius:'8px',
                  border:'0.5px solid rgba(255,255,255,0.15)',
                  background:'rgba(255,255,255,0.07)',color:'#fff',
                  fontSize:'14px',outline:'none',
                }}
              />
              <button onClick={createGroup} disabled={creating} style={{
                background:'#FFD166',color:'#1a0e00',border:'none',
                borderRadius:'8px',padding:'10px 20px',fontSize:'14px',
                fontWeight:700,cursor:'pointer',
              }}>{creating ? '...' : 'Create'}</button>
            </div>
          </div>
        )}

        {groups.length === 0 && !showCreate && (
          <button onClick={()=>setShowCreate(true)} style={{
            width:'100%',padding:'20px',borderRadius:'12px',
            border:'1px dashed rgba(255,255,255,0.15)',
            background:'rgba(255,255,255,0.03)',
            color:'rgba(255,255,255,0.5)',fontSize:'15px',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',
          }}>
            <span style={{fontSize:'22px'}}>+</span>
            Create your first group
          </button>
        )}

        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {groups.map(group => (
            <div key={group.id} style={{
              background:'rgba(255,255,255,0.05)',
              border:'0.5px solid rgba(255,255,255,0.1)',
              borderRadius:'12px',padding:'20px 24px',
              display:'flex',alignItems:'center',justifyContent:'space-between',
            }}>
              <div>
                <div style={{fontSize:'17px',fontWeight:600,color:'#fff',marginBottom:'4px'}}>{group.name}</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>Code: {group.invite_code}</div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={()=>copyInviteLink(group.invite_code)} style={{
                  background: copiedId===group.invite_code ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.07)',
                  border: copiedId===group.invite_code ? '0.5px solid rgba(29,158,117,0.4)' : '0.5px solid rgba(255,255,255,0.12)',
                  borderRadius:'8px',padding:'8px 16px',
                  color: copiedId===group.invite_code ? '#5DCAA5' : 'rgba(255,255,255,0.6)',
                  fontSize:'13px',cursor:'pointer',
                }}>
                  {copiedId===group.invite_code ? '✓ Copied!' : 'Copy invite link'}
                </button>
                <button onClick={()=>window.location.href=`/group/${group.id}`} style={{
                  background:'#FFD166',color:'#1a0e00',border:'none',
                  borderRadius:'8px',padding:'8px 16px',fontSize:'13px',
                  fontWeight:700,cursor:'pointer',
                }}>Open group →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}