'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PredictionDraft {
  matchId: number
  homeGoals: number | null
  awayGoals: number | null
  advancingTeamId: number | null
}

// ── Helper interno: borra la predicción validando corte de tiempo ──────────
async function _deletePrediction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  matchId: number,
  matchDate: string,
  status: string,
  now: number,
): Promise<void> {
  if (status === 'FINISHED' || status === 'CANCELLED') throw new Error('No acepta modificaciones')
  const cutoffMs = new Date(matchDate).getTime() - 60 * 60 * 1000
  if (now >= cutoffMs) throw new Error('Plazo cerrado')

  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('profile_id', userId)
    .eq('match_id', matchId)

  if (error) throw new Error(error.message)
}

export async function saveAllPredictionsAction(
  drafts: PredictionDraft[]
): Promise<{ saved: number; failed: { matchId: number; error: string }[] }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { saved: 0, failed: drafts.map(d => ({ matchId: d.matchId, error: 'No autenticado' })) }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, match_date, status, stage, home_team_id, away_team_id')
    .in('id', drafts.map(d => d.matchId))

  const matchMap = new Map((matches ?? []).map(m => [m.id, m]))
  const now = Date.now()

  const outcomes = await Promise.allSettled(
    drafts.map(async ({ matchId, homeGoals, awayGoals, advancingTeamId: clientAdvancingId }) => {
      const match = matchMap.get(matchId)
      if (!match) throw new Error('Partido no encontrado')
      if (match.status === 'FINISHED' || match.status === 'CANCELLED') throw new Error('No acepta predicciones')

      const cutoffMs = new Date(match.match_date).getTime() - 60 * 60 * 1000
      if (now >= cutoffMs) throw new Error('Plazo cerrado')

      // Borrador nulo → DELETE
      if (homeGoals === null && awayGoals === null) {
        await _deletePrediction(supabase, user.id, matchId, match.match_date, match.status, now)
        return
      }

      if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) throw new Error('Goles inválidos')
      if (homeGoals! < 0 || awayGoals! < 0 || homeGoals! > 99 || awayGoals! > 99) throw new Error('Goles fuera de rango')

      let pred_advancing_team_id: number | null = null
      if (match.stage !== 'GROUP') {
        if (homeGoals! > awayGoals!) {
          pred_advancing_team_id = match.home_team_id
        } else if (awayGoals! > homeGoals!) {
          pred_advancing_team_id = match.away_team_id
        } else {
          if (!clientAdvancingId) throw new Error('Selecciona quién clasifica por penaltis')
          if (clientAdvancingId !== match.home_team_id && clientAdvancingId !== match.away_team_id) {
            throw new Error('Equipo no pertenece al partido')
          }
          pred_advancing_team_id = clientAdvancingId
        }
      }

      const { error } = await supabase
        .from('predictions')
        .upsert({
          profile_id: user.id,
          match_id: matchId,
          pred_home_goals: homeGoals,
          pred_away_goals: awayGoals,
          pred_advancing_team_id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'profile_id, match_id' })

      if (error) throw new Error(error.message)
    })
  )

  revalidatePath('/')

  const failed = outcomes
    .map((o, i) => o.status === 'rejected'
      ? { matchId: drafts[i].matchId, error: (o.reason as Error).message }
      : null
    )
    .filter(Boolean) as { matchId: number; error: string }[]

  return { saved: outcomes.filter(o => o.status === 'fulfilled').length, failed }
}

export async function savePredictionAction(
  matchId: number,
  homeGoals: number | null,
  awayGoals: number | null,
  clientAdvancingId: number | null = null,
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('match_date, status, stage, home_team_id, away_team_id')
    .eq('id', matchId)
    .single()

  if (matchError || !match) return { error: 'Partido no encontrado' }
  if (match.status === 'FINISHED' || match.status === 'CANCELLED') {
    return { error: 'Este partido ya no acepta predicciones' }
  }

  const cutoffMs = new Date(match.match_date).getTime() - 60 * 60 * 1000
  if (Date.now() >= cutoffMs) {
    return { error: 'El plazo para predecir ha cerrado (se cierra 1 hora antes del partido)' }
  }

  // Borrador nulo → DELETE
  if (homeGoals === null && awayGoals === null) {
    try {
      await _deletePrediction(supabase, user.id, matchId, match.match_date, match.status, Date.now())
      revalidatePath('/')
      return { success: true }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }

  if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
    return { error: 'Los goles deben ser números enteros' }
  }
  if (homeGoals! < 0 || awayGoals! < 0 || homeGoals! > 99 || awayGoals! > 99) {
    return { error: 'Valor de goles fuera de rango (0–99)' }
  }

  let pred_advancing_team_id: number | null = null
  if (match.stage !== 'GROUP') {
    if (homeGoals! > awayGoals!) {
      pred_advancing_team_id = match.home_team_id
    } else if (awayGoals! > homeGoals!) {
      pred_advancing_team_id = match.away_team_id
    } else {
      if (!clientAdvancingId) {
        return { error: 'En eliminatoria con empate debes seleccionar quién clasifica por penaltis' }
      }
      if (clientAdvancingId !== match.home_team_id && clientAdvancingId !== match.away_team_id) {
        return { error: 'El equipo seleccionado no pertenece a este partido' }
      }
      pred_advancing_team_id = clientAdvancingId
    }
  }

  const { error } = await supabase
    .from('predictions')
    .upsert({
      profile_id: user.id,
      match_id: matchId,
      pred_home_goals: homeGoals,
      pred_away_goals: awayGoals,
      pred_advancing_team_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id, match_id' })

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
