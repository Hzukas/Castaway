import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

function checkAuth(req) {
  const password = req.headers.get('x-admin-password')
  return password && password === process.env.ADMIN_PASSWORD
}

export async function GET(req) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { data: profiles } = await supabaseAdmin.from('profiles').select('*')

  const users = authData.users.map(u => {
    const profile = profiles?.find(p => p.user_id === u.id) || {}
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      display_name: profile.display_name || null,
      avatar_url: profile.avatar_url || null,
      home_airport: profile.home_airport || null,
      passport_holder: profile.passport_holder ?? null,
      max_flight_hours: profile.max_flight_hours || null,
      budget_min: profile.budget_min || null,
      budget_max: profile.budget_max || null,
    }
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return NextResponse.json({ users })
}

export async function DELETE(req) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'missing user_id' }, { status: 400 })

  await supabaseAdmin.from('group_members').delete().eq('user_id', user_id)

  const { data: ownedGroups } = await supabaseAdmin.from('groups').select('id').eq('created_by', user_id)
  if (ownedGroups && ownedGroups.length) {
    const groupIds = ownedGroups.map(g => g.id)
    await supabaseAdmin.from('group_members').delete().in('group_id', groupIds)
    await supabaseAdmin.from('groups').delete().in('id', groupIds)
  }

  await supabaseAdmin.from('profiles').delete().eq('user_id', user_id)

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function PATCH(req) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { user_id, updates } = await req.json()
  if (!user_id || !updates) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

  const { error } = await supabaseAdmin.from('profiles').update(updates).eq('user_id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}