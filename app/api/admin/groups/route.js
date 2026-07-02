import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

function checkAuth(req) {
  const password = req.headers.get('x-admin-password')
  return password && password === process.env.ADMIN_PASSWORD
}

export async function GET(req) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: groups, error } = await supabaseAdmin.from('groups').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: members } = await supabaseAdmin.from('group_members').select('group_id')
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const { data: profiles } = await supabaseAdmin.from('profiles').select('user_id, display_name')

  const counts = {}
  members?.forEach(m => { counts[m.group_id] = (counts[m.group_id] || 0) + 1 })

  const groupsWithInfo = groups.map(g => {
    const creator = authData?.users.find(u => u.id === g.created_by)
    const creatorProfile = profiles?.find(p => p.user_id === g.created_by)
    return {
      ...g,
      member_count: (counts[g.id] || 0) + 1,
      creator_email: creator?.email || 'unknown',
      creator_name: creatorProfile?.display_name || null,
    }
  }).sort((a, b) => b.id.localeCompare(a.id))

  return NextResponse.json({ groups: groupsWithInfo })
}

export async function DELETE(req) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { group_id } = await req.json()
  if (!group_id) return NextResponse.json({ error: 'missing group_id' }, { status: 400 })

  await supabaseAdmin.from('group_members').delete().eq('group_id', group_id)
  const { error } = await supabaseAdmin.from('groups').delete().eq('id', group_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}