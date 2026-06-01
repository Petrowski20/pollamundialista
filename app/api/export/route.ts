import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [profilesRes, matchesRes, predsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, nickname, total_points, role, city, created_at')
      .order('total_points', { ascending: false }),
    supabase
      .from('matches')
      .select(`
        id, match_date, stage, group_letter, status, home_goals, away_goals, stadium, referee,
        home_team:teams!home_team_id (name, flag_emoji),
        away_team:teams!away_team_id (name, flag_emoji)
      `)
      .order('match_date', { ascending: true }),
    supabase
      .from('predictions')
      .select('profile_id, match_id, pred_home_goals, pred_away_goals, points_earned, updated_at')
      .order('match_id', { ascending: true }),
  ])

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    profiles: profilesRes.data ?? [],
    matches: matchesRes.data ?? [],
    predictions: predsRes.data ?? [],
  })
}
