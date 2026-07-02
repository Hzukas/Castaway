'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const ADMIN_EMAIL = 'harrisonzukas@gmail.com'

export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [checking, setChecking] = useState(false)

  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ display_name: '', home_airport: '' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.email === ADMIN_EMAIL) setIsAdmin(true)
      setAuthChecked(true)
    })
  }, [])

  async function unlock() {
    setChecking(true)
    setPasswordError('')
    const res = await fetch('/api/admin/users', { headers: { 'x-admin-password': password } })
    if (res.status === 401) {
      setPasswordError('Wrong password.')
      setChecking(false)
      return
    }
    const data = await res.json()
    setUsers(data.users)
    await loadGroups()
    setUnlocked(true)
    setChecking(false)
  }

  async function loadGroups() {
    const res = await fetch('/api/admin/groups', { headers: { 'x-admin-password': password } })
    const data = await res.json()
    setGroups(data.groups || [])
  }

  async function refreshUsers() {
    const res = await fetch('/api/admin/users', { headers: { 'x-admin-password': password } })
    const data = await res.json()
    setUsers(data.users)
  }

  async function deleteUser(userId, email) {
    if (!confirm(`Permanently delete ${email}? This deletes their profile, groups they created, and their group memberships. This cannot be undone.`)) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) { refreshUsers(); loadGroups() }
    else alert('Failed to delete user.')
  }

  async function deleteGroup(groupId, name) {
    if (!confirm(`Permanently delete "${name}"? This removes all members and pitches. This cannot be undone.`)) return
    const res = await fetch('/api/admin/groups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ group_id: groupId }),
    })
    if (res.ok) loadGroups()
    else alert('Failed to delete group.')
  }

  function openEdit(user) {
    setEditingUser(user)
    setEditForm({ display_name: user.display_name || '', home_airport: user.home_airport || '' })
  }

  async function saveEdit() {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ user_id: editingUser.id, updates: editForm }),
    })
    if (res.ok) { setEditingUser(null); refreshUsers() }
    else alert('Failed to save.')
  }

  const filteredUsers = users.filter(u =>
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase())
  )
  const filteredGroups = groups.filter(g =>
    (g.name || '').toLowerCase().includes(groupSearch.toLowerCase()) ||
    (g.invite_code || '').toLowerCase().includes(groupSearch.toLowerCase())
  )

  const stats = {
    totalUsers: users.length,
    totalGroups: groups.length,
    newUsersWeek: users.filter(u => (Date.now() - new Date(u.created_at)) < 7*24*60*60*1000).length,
    avgGroupSize: groups.length ? (groups.reduce((s,g)=>s+g.member_count,0) / groups.length).toFixed(1) : 0,
  }

  const input = {
    padding:'8px 12px',borderRadius:'8px',border:'0.5px solid rgba(255,255,255,0.15)',
    background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:'13px',outline:'none',
  }
  const th = { textAlign:'left',fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.35)',padding:'8px 10px',letterSpacing:'0.04em',textTransform:'uppercase' }
  const td = { padding:'10px',fontSize:'13px',color:'rgba(255,255,255,0.75)',borderTop:'0.5px solid rgba(255,255,255,0.06)' }

  if (!authChecked) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif'}}>Loading...</div>
    </main>
  )

  if (!isAdmin) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{color:'rgba(255,255,255,0.4)',fontSize:'14px'}}>Not authorized.</div>
    </main>
  )

  if (!unlocked) return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'rgba(255,255,255,0.05)',border:'0.5px solid rgba(255,255,255,0.1)',borderRadius:'16px',padding:'2.5rem',width:'100%',maxWidth:'360px'}}>
        <div style={{fontSize:'13px',color:'#FFD166',fontWeight:600,letterSpacing:'0.1em',marginBottom:'8px',textAlign:'center'}}>ADMIN ACCESS</div>
        <h1 style={{color:'#fff',fontSize:'20px',fontWeight:700,margin:'0 0 20px',textAlign:'center'}}>Enter admin password</h1>
        <input
          type="password"
          value={password}
          onChange={e=>{setPassword(e.target.value);setPasswordError('')}}
          onKeyDown={e=>e.key==='Enter'&&unlock()}
          style={{...input,width:'100%',boxSizing:'border-box',marginBottom:'12px',padding:'12px 14px'}}
          autoFocus
        />
        {passwordError && <div style={{color:'#F0997B',fontSize:'12px',marginBottom:'12px',textAlign:'center'}}>{passwordError}</div>}
        <button onClick={unlock} disabled={checking} style={{
          width:'100%',padding:'12px',borderRadius:'10px',background:'#FFD166',color:'#1a0e00',
          border:'none',fontSize:'14px',fontWeight:700,cursor:'pointer',
        }}>{checking ? 'Checking...' : 'Unlock'}</button>
      </div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',background:'#0d1f2d',fontFamily:'sans-serif'}}>
      <nav style={{padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'0.5px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <button onClick={()=>window.location.href='/dashboard'} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:'13px',cursor:'pointer'}}>← Back</button>
          <div style={{fontSize:'18px',fontWeight:700,color:'#FFD166',letterSpacing:'0.05em'}}>CASTAWAY ADMIN</div>
        </div>
      </nav>

      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'32px 24px'}}>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'28px'}}>
          {[
            ['Total users', stats.totalUsers],
            ['Total groups', stats.totalGroups],
            ['New users (7d)', stats.newUsersWeek],
            ['Avg group size', stats.avgGroupSize],
          ].map(([label,val])=>(
            <div key={label} style={{background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px'}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'4px'}}>{label}</div>
              <div style={{fontSize:'24px',fontWeight:700,color:'#fff'}}>{val}</div>
            </div>
          ))}
        </div>

        {/* USERS */}
        <div style={{marginBottom:'32px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <div style={{fontSize:'15px',fontWeight:600,color:'#fff'}}>Users ({filteredUsers.length})</div>
            <input placeholder="Search users..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} style={{...input,width:'220px'}}/>
          </div>
          <div style={{background:'rgba(255,255,255,0.03)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:'12px',overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={th}>Name</th><th style={th}>Email</th><th style={th}>Airport</th>
                    <th style={th}>Passport</th><th style={th}>Joined</th><th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u=>(
                    <tr key={u.id}>
                      <td style={td}>{u.display_name || <span style={{color:'rgba(255,255,255,0.25)'}}>—</span>}</td>
                      <td style={td}>{u.email}</td>
                      <td style={td}>{u.home_airport || '—'}</td>
                      <td style={td}>{u.passport_holder===true?'Yes':u.passport_holder===false?'No':'—'}</td>
                      <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{...td,display:'flex',gap:'6px'}}>
                        <button onClick={()=>openEdit(u)} style={{background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:'6px',padding:'4px 10px',color:'rgba(255,255,255,0.5)',fontSize:'11px',cursor:'pointer'}}>Edit</button>
                        <button onClick={()=>deleteUser(u.id,u.email)} style={{background:'rgba(216,90,48,0.1)',border:'0.5px solid rgba(216,90,48,0.3)',borderRadius:'6px',padding:'4px 10px',color:'#F0997B',fontSize:'11px',cursor:'pointer'}}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* GROUPS */}
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <div style={{fontSize:'15px',fontWeight:600,color:'#fff'}}>Groups ({filteredGroups.length})</div>
            <input placeholder="Search groups..." value={groupSearch} onChange={e=>setGroupSearch(e.target.value)} style={{...input,width:'220px'}}/>
          </div>
          <div style={{background:'rgba(255,255,255,0.03)',border:'0.5px solid rgba(255,255,255,0.08)',borderRadius:'12px',overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <th style={th}>Name</th><th style={th}>Code</th><th style={th}>Creator</th>
                    <th style={th}>Members</th><th style={th}>Budget</th><th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map(g=>(
                    <tr key={g.id}>
                      <td style={td}>{g.name}</td>
                      <td style={{...td,color:'#FFD166'}}>{g.invite_code}</td>
                      <td style={td}>{g.creator_name || g.creator_email}</td>
                      <td style={td}>{g.member_count}</td>
                      <td style={td}>{g.target_budget ? `$${g.target_budget}` : '—'}</td>
                      <td style={td}>
                        <button onClick={()=>deleteGroup(g.id,g.name)} style={{background:'rgba(216,90,48,0.1)',border:'0.5px solid rgba(216,90,48,0.3)',borderRadius:'6px',padding:'4px 10px',color:'#F0997B',fontSize:'11px',cursor:'pointer'}}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#0d1f2d',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:'16px',padding:'24px',width:'360px'}}>
            <div style={{fontSize:'15px',fontWeight:600,color:'#fff',marginBottom:'16px'}}>Edit {editingUser.email}</div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Display name</div>
              <input value={editForm.display_name} onChange={e=>setEditForm(f=>({...f,display_name:e.target.value}))} style={{...input,width:'100%',boxSizing:'border-box'}}/>
            </div>
            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Home airport</div>
              <input value={editForm.home_airport} onChange={e=>setEditForm(f=>({...f,home_airport:e.target.value.toUpperCase()}))} style={{...input,width:'100%',boxSizing:'border-box'}}/>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setEditingUser(null)} style={{flex:1,padding:'10px',borderRadius:'8px',background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.5)',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
              <button onClick={saveEdit} style={{flex:1,padding:'10px',borderRadius:'8px',background:'#FFD166',border:'none',color:'#1a0e00',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}