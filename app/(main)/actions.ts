'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePredictionAction(matchId: number, homeGoals: number, awayGoals: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }

  // Validación server-side de los valores de goles
  if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
    return { error: 'Los goles deben ser números enteros' }
  }
  if (homeGoals < 0 || awayGoals < 0 || homeGoals > 99 || awayGoals > 99) {
    return { error: 'Valor de goles fuera de rango (0–99)' }
  }

  // Verificación server-side de la ventana de tiempo (60 minutos antes del partido)
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('match_date, status')
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

  const { error } = await supabase
    .from('predictions')
    .upsert({
      profile_id: user.id,
      match_id: matchId,
      pred_home_goals: homeGoals,
      pred_away_goals: awayGoals,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id, match_id',
    })

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
