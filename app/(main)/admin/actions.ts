'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function finalizeMatchAction(
  matchId: number,
  homeGoals: number,
  awayGoals: number
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') return { error: 'Acceso denegado: se requiere rol ADMIN' }

  const { error } = await supabase.rpc('calculate_match_points', {
    p_match_id:  matchId,
    p_home_goals: homeGoals,
    p_away_goals: awayGoals,
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/predicciones')
  revalidatePath('/clasificacion')

  return { success: true }
}
