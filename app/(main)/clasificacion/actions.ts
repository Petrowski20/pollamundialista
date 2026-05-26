'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function setLastViewedLeague(leagueId: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({ last_viewed_league_id: leagueId })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/clasificacion')
  return { error: null }
}
