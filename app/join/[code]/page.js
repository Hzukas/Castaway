'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'

export default function JoinGroup() {
  const { code } = useParams()
  const [user, setUser] = useState(null)
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      localStorage.setItem('joinAfterAuth', code)
      window.location.href = '/auth'
      return
    }
    setUser(user)
    await loadGroup(user)
  }

  async function loadGroup(currentUser) {
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', code)
      .single()

    if (!groupData) {
      setError('Group not found. Check the invite link.')
      setLoading(false)
      return
    }
    setGroup(groupData)

    const { data: memberData } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupData.id)
      .eq('user_id', currentUser.id)

    if (memberData && memberData.length > 0) {
      setAlreadyMember(true)
    }

    if (groupData.created_by === currentUser.id) {
      setAlreadyMember(true)
    }

    setLoading(false)
  }

  async function joinGroup() {
    setJoining(true)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      email: user.email,
      home_airport: profile?.home_airport || null,
      max_flight_hours: profile?.max_flight_hours || null,
    })

    setJoined(true)
    setJoining(false)
    setTimeout(() => {
      window.location.href = `/group/${group.id}`
    }, 1500)
  }

  if (loading) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif'}}>Loading...</div>
    </main>
  )

  if (error) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>🏝️</div>
        <div style={{color:'rgba(255,255,255,0.6)',fontSize:'16px',marginBottom:'8px'}}>{error}</div>
        <button onClick={()=>window.location.href='/dashboard'} style={{
          background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.12)',
          borderRadius:'8px',padding:'8px 20px',color:'rgba(255,255,255,0.5)',
          fontSize:'13px',cursor:'pointer',marginTop:'16px',
        }}>Go to dashboard</button>
      </div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{
        background:'rgba(255,255,255,0.05)',
        border:'0.5px solid rgba(255,255,255,0.1)',
        borderRadius:'16px',
        padding:'2.5rem',
        width:'100%',
        maxWidth:'440px',
        textAlign:'center',
      }}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>🏝️</div>
        <div style={{fontSize:'13px',color:'#FFD166',fontWeight:600,letterSpacing:'0.1em',marginBottom:'8px'}}>CASTAWAY</div>
        <h1 style={{color:'#fff',fontSize:'24px',fontWeight:700,margin:'0 0 8px'}}>
          {alreadyMember ? "You're already in!" : joined ? 'Welcome aboard!' : `Join ${group.name}`}
        </h1>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:'14px',marginBottom:'24px'}}>
          {alreadyMember
            ? `You're already a member of ${group.name}.`
            : joined
            ? 'Taking you to the group now...'
            : `You've been invited to plan a trip with ${group.name}.`
          }
        </p>

        {alreadyMember ? (
          <button onClick={()=>window.location.href=`/group/${group.id}`} style={{
            width:'100%',padding:'13px',borderRadius:'10px',
            background:'#FFD166',color:'#1a0e00',border:'none',
            fontSize:'15px',fontWeight:700,cursor:'pointer',
          }}>Open group →</button>
        ) : joined ? (
          <div style={{
            padding:'12px',borderRadius:'10px',
            background:'rgba(29,158,117,0.15)',border:'0.5px solid rgba(29,158,117,0.3)',
            color:'#5DCAA5',fontSize:'14px',fontWeight:600,
          }}>✓ Joined!</div>
        ) : (
          <button onClick={joinGroup} disabled={joining} style={{
            width:'100%',padding:'13px',borderRadius:'10px',
            background:'#FFD166',color:'#1a0e00',border:'none',
            fontSize:'15px',fontWeight:700,cursor:'pointer',
          }}>
            {joining ? 'Joining...' : 'Join this group'}
          </button>
        )}

        {!alreadyMember && !joined && (
          <div style={{marginTop:'16px',fontSize:'12px',color:'rgba(255,255,255,0.25)'}}>
            Signed in as {user?.email}
          </div>
        )}
      </div>
    </main>
  )
}