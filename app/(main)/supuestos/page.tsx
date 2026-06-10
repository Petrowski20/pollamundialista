import { createClient } from '@/utils/supabase/server'
import SimuladorClient from '@/components/SimuladorClient'

interface Team {
  name: string
  iso_code: string
  flag_emoji: string | null
}

interface Match {
  id: number
  group_letter: string
  home_team_id: number
  away_team_id: number
  home_team: Team
  away_team: Team
}

interface Prediction {
  match_id: number
  pred_home_goals: number
  pred_away_goals: number
}

interface TeamStanding {
  id: number
  name: string
  flag: string | null
  isoCode: string
  pts: number
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dg: number
}

function calcStandings(matches: Match[], predMap: Map<number, Prediction>): TeamStanding[] {
  const standings = new Map<number, TeamStanding>()

  for (const m of matches) {
    if (!standings.has(m.home_team_id)) {
      standings.set(m.home_team_id, {
        id: m.home_team_id, name: m.home_team.name,
        flag: m.home_team.flag_emoji, isoCode: m.home_team.iso_code,
        pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0,
      })
    }
    if (!standings.has(m.away_team_id)) {
      standings.set(m.away_team_id, {
        id: m.away_team_id, name: m.away_team.name,
        flag: m.away_team.flag_emoji, isoCode: m.away_team.iso_code,
        pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0,
      })
    }
  }

  for (const m of matches) {
    const pred = predMap.get(m.id)
    const hg = pred?.pred_home_goals ?? 0
    const ag = pred?.pred_away_goals ?? 0
    const home = standings.get(m.home_team_id)!
    const away = standings.get(m.away_team_id)!

    home.pj++; away.pj++
    home.gf += hg; home.gc += ag
    away.gf += ag; away.gc += hg

    if (hg > ag) {
      home.pg++; home.pts += 3; away.pp++
    } else if (hg < ag) {
      away.pg++; away.pts += 3; home.pp++
    } else {
      home.pe++; home.pts += 1; away.pe++; away.pts += 1
    }
  }

  return Array.from(standings.values())
    .map(team => ({ ...team, dg: team.gf - team.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)
}

export default async function SupuestosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [matchesRes, predsRes] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        id, group_letter, home_team_id, away_team_id,
        home_team:teams!home_team_id (name, iso_code, flag_emoji),
        away_team:teams!away_team_id (name, iso_code, flag_emoji)
      `)
      .eq('stage', 'GROUP')
      .order('group_letter', { ascending: true }),
    supabase
      .from('predictions')
      .select('match_id, pred_home_goals, pred_away_goals')
      .eq('profile_id', user?.id ?? ''),
  ])

  const matches = (matchesRes.data ?? []) as unknown as Match[]
  const preds   = (predsRes.data ?? []) as Prediction[]

  const predMap = new Map<number, Prediction>(preds.map(p => [p.match_id, p]))

  const groupedMatches = new Map<string, Match[]>()
  for (const m of matches) {
    const g = m.group_letter ?? 'X'
    if (!groupedMatches.has(g)) groupedMatches.set(g, [])
    groupedMatches.get(g)!.push(m)
  }

  const groups = Array.from(groupedMatches.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, groupMatches]) => ({
      letter,
      standings: calcStandings(groupMatches, predMap),
    }))

  type ThirdPlace = TeamStanding & { groupLetter: string }

  const allThirds: ThirdPlace[] = groups
    .filter(g => g.standings.length >= 3)
    .map(g => ({ ...g.standings[2], groupLetter: g.letter }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf)

  const groupMatchIds = new Set(matches.map(m => m.id))
  const predCount = preds.filter(p => groupMatchIds.has(p.match_id)).length

  return (
    <SimuladorClient
      groups={groups}
      allThirds={allThirds}
      predCount={predCount}
      totalGroupMatches={matches.length}
    />
  )
}
