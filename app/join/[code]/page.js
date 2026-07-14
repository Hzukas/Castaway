'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { getSafeUser, safeRedirect } from '../../../lib/authGuard'
import { useParams } from 'next/navigation'
import EgoPicker from '../../../components/EgoPicker'

export default function JoinGroup() {
  const { code } = useParams()
  const [user, setUser] = useState(null)
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [error, setError] = useState('')
  const [egos, setEgos] = useState([])
  const [accountAvatarUrl, setAccountAvatarUrl] = useState(null)
  const [showEgoPicker, setShowEgoPicker] = useState(false)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const safeUser = await getSafeUser()
    if (!safeUser) {
      localStorage.setItem('joinAfterAuth', code)
      if (!safeRedirect('/auth')) setAuthFailed(true)
      return
    }

    const { data: personalities } = await supabase.from('personalities').select('*').eq('user_id', safeUser.id).order('created_at', { ascending: true })
    if (!personalities || personalities.length === 0) {
      localStorage.setItem('joinAfterAuth', code)
      if (!safeRedirect('/onboarding')) setAuthFailed(true)
      return
    }
    setEgos(personalities)

    const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('user_id', safeUser.id).single()
    setAccountAvatarUrl(profile?.avatar_url || null)

    setUser(safeUser)
    await loadGroup(safeUser)
  }

  async function loadGroup(currentUser) {
    const { data: groupData } = await supabase.from('groups').select('*').eq('invite_code', code).single()
    if (!groupData) { setError('Group not found. Check the invite link.'); setLoading(false); return }
    setGroup(groupData)
    const { data: memberData } = await supabase.from('group_members').select('*').eq('group_id', groupData.id).eq('user_id', currentUser.id)
    if (memberData && memberData.length > 0) setAlreadyMember(true)
    if (groupData.created_by === currentUser.id) setAlreadyMember(true)
    setLoading(false)
  }

  async function joinGroup() {
    const { data: existingMemberships } = await supabase.from('group_members').select('id').eq('user_id', user.id)
    const isFirstGroup = !existingMemberships || existingMemberships.length === 0
    if (isFirstGroup) {
      await finalizeJoin(egos[0]?.id || null)
    } else {
      setShowEgoPicker(true)
    }
  }

  async function finalizeJoin(personalityId) {
    setJoining(true)
    const { data: profile } = await supabase.from('profiles').select('home_airport').eq('user_id', user.id).single()
    const ego = egos.find(e => e.id === personalityId)
    await supabase.from('group_members').insert({
      group_id: group.id, user_id: user.id, email: user.email,
      home_airport: profile?.home_airport || null, max_flight_hours: ego?.max_flight_hours || null,
      personality_id: personalityId,
    })
    setShowEgoPicker(false)
    setJoined(true)
    setJoining(false)
    setTimeout(() => { window.location.href = `/group/${group.id}` }, 1500)
  }

  function manualSignIn() {
    try { sessionStorage.removeItem('cw_redirects') } catch (e) {}
    localStorage.setItem('joinAfterAuth', code)
    supabase.auth.signOut().finally(() => { window.location.href = '/auth' })
  }

  if (loading) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        {authFailed ? (
          <div>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>🏝️</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:'15px',marginBottom:'14px'}}>Sign in to join this group.</div>
            <button onClick={manualSignIn} style={{background:'#FFD166',color:'#1a0e00',border:'none',borderRadius:'8px',padding:'10px 22px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>Sign in</button>
          </div>
        ) : (
          <div style={{color:'rgba(255,255,255,0.4)'}}>Loading...</div>
        )}
      </div>
    </main>
  )

  if (error) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>🏝️</div>
        <div style={{color:'rgba(255,255,255,0.6)',fontSize:'16px',marginBottom:'8px'}}>{error}</div>
        <button onClick={()=>window.location.href='/dashboard'} style={{background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:'8px',padding:'8px 20px',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer',marginTop:'16px'}}>Go to dashboard</button>
      </div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'rgba(255,255,255,0.05)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:'16px',padding:'2.5rem',width:'100%',maxWidth:'440px',textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>🏝️</div>
        <div style={{fontSize:'13px',color:'#FFD166',fontWeight:600,letterSpacing:'0.1em',marginBottom:'8px'}}>CASTAWAY</div>
        <h1 style={{color:'#fff',fontSize:'24px',fontWeight:700,margin:'0 0 8px'}}>
          {alreadyMember ? "You're already in!" : joined ? 'Welcome aboard!' : `Join ${group.name}`}
        </h1>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:'14px',marginBottom:'24px'}}>
          {alreadyMember ? `You're already a member of ${group.name}.` : joined ? 'Taking you to the group now...' : `You've been invited to plan a trip with ${group.name}.`}
        </p>

        {alreadyMember ? (
          <button onClick={()=>window.location.href=`/group/${group.id}`} style={{width:'100%',padding:'13px',borderRadius:'10px',background:'#FFD166',color:'#1a0e00',border:'none',fontSize:'15px',fontWeight:700,cursor:'pointer'}}>Open group →</button>
        ) : joined ? (
          <div style={{padding:'12px',borderRadius:'10px',background:'rgba(29,158,117,0.15)',border:'0.5px solid rgba(29,158,117,0.3)',color:'#5DCAA5',fontSize:'14px',fontWeight:600}}>✓ Joined!</div>
        ) : (
          <button onClick={joinGroup} disabled={joining} style={{width:'100%',padding:'13px',borderRadius:'10px',background:'#FFD166',color:'#1a0e00',border:'none',fontSize:'15px',fontWeight:700,cursor:'pointer'}}>{joining ? 'Joining...' : 'Join this group'}</button>
        )}

        {!alreadyMember && !joined && (
          <div style={{marginTop:'16px',fontSize:'12px',color:'rgba(255,255,255,0.25)'}}>Signed in as {user?.email}</div>
        )}
      </div>

      {showEgoPicker && (
        <EgoPicker
          userId={user.id}
          personalities={egos}
          accountAvatarUrl={accountAvatarUrl}
          onConfirm={(personalityId)=>finalizeJoin(personalityId)}
          onCancel={()=>setShowEgoPicker(false)}
        />
      )}
    </main>
  )
}