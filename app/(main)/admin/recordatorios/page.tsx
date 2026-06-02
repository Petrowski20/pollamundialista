import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import RemindersView, { type MatchWithVoters } from '@/components/RemindersView'

export default async function RecordatoriosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') redirect('/')

  const cutoffTime = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const [{ data: matches }, { data: profiles }] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        id, match_date, stage, group_letter,
        home_team:teams!home_team_id (name, flag_emoji),
        away_team:teams!away_team_id (name, flag_emoji)
      `)
      .eq('status', 'PENDING')
      .gt('match_date', cutoffTime)
      .order('match_date', { ascending: true })
      .limit(5),
    supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .order('nickname', { ascending: true }),
  ])

  const matchIds = (matches ?? []).map((m) => m.id)

  const { data: predictions } = matchIds.length > 0
    ? await supabase
        .from('predictions')
        .select('match_id, profile_id')
        .in('match_id', matchIds)
    : { data: [] as { match_id: number; profile_id: string }[] }

  type RawMatch = {
    id: number
    match_date: string
    stage: string
    group_letter: string | null
    home_team: { name: string; flag_emoji: string } | null
    away_team: { name: string; flag_emoji: string } | null
  }

  const matchesWithVoters: MatchWithVoters[] = ((matches ?? []) as unknown as RawMatch[]).map((match) => {
    const voterIds = new Set(
      (predictions ?? [])
        .filter((p) => p.match_id === match.id)
        .map((p) => p.profile_id),
    )
    return {
      ...match,
      hanVotado:      (profiles ?? []).filter((p) => voterIds.has(p.id)),
      faltanPorVotar: (profiles ?? []).filter((p) => !voterIds.has(p.id)),
    }
  })

  return <RemindersView matches={matchesWithVoters} />
}
