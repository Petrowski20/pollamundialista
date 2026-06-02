'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePredictionAction(
  matchId: number,
  homeGoals: number,
  awayGoals: number,
  clientAdvancingId: number | null = null,
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }

  if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
    return { error: 'Los goles deben ser números enteros' }
  }
  if (homeGoals < 0 || awayGoals < 0 || homeGoals > 99 || awayGoals > 99) {
    return { error: 'Valor de goles fuera de rango (0–99)' }
  }

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

  // ── Sanitización del clasificado (anti-trampa) ──────────────
  let pred_advancing_team_id: number | null = null

  if (match.stage !== 'GROUP') {
    if (homeGoals > awayGoals) {
      // El servidor fuerza el clasificado independientemente del cliente
      pred_advancing_team_id = match.home_team_id
    } else if (awayGoals > homeGoals) {
      pred_advancing_team_id = match.away_team_id
    } else {
      // Empate real: solo aquí se acepta la elección del cliente
      if (!clientAdvancingId) {
        return { error: 'En eliminatoria con empate debes seleccionar quién clasifica por penaltis' }
      }
      if (clientAdvancingId !== match.home_team_id && clientAdvancingId !== match.away_team_id) {
        return { error: 'El equipo seleccionado no pertenece a este partido' }
      }
      pred_advancing_team_id = clientAdvancingId
    }
  }
  // ────────────────────────────────────────────────────────────

  const { error } = await supabase
    .from('predictions')
    .upsert({
      profile_id: user.id,
      match_id: matchId,
      pred_home_goals: homeGoals,
      pred_away_goals: awayGoals,
      pred_advancing_team_id,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id, match_id',
    })

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
