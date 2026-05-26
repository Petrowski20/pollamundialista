'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePredictionAction(matchId: number, homeGoals: number, awayGoals: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }

  // Hacemos el UPSERT en la base de datos
  const { error } = await supabase
    .from('predictions')
    .upsert({
      profile_id: user.id,
      match_id: matchId,
      pred_home_goals: homeGoals,
      pred_away_goals: awayGoals,
      updated_at: new Date().toISOString(),
    }, { 
      onConflict: 'profile_id, match_id' // Usa la restricción UNIQUE que creaste en el SQL
    })

  if (error) {
    // Si la regla de 1 hora de RLS lo bloquea, lanzará un error que capturamos aquí
    return { error: error.message }
  }

  // Refrescamos las cachés de Next.js para que se actualicen los colores al instante
  revalidatePath('/predicciones')
  revalidatePath('/')
  
  return { success: true }
}
