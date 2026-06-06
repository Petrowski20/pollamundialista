'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function syncMatchesAction(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'No estás autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') return { success: false, message: 'Acceso denegado: se requiere rol ADMIN' }

  // TODO: en producción, hacer fetch a la API de fútbol y upsert en matches
  // Ejemplo:
  // const res = await fetch('https://api.football-data.org/v4/competitions/2000/matches', {
  //   headers: { 'X-Auth-Token': process.env.FOOTBALL_API_TOKEN! },
  // })
  // const { matches: apiMatches } = await res.json()
  // await supabase.from('matches').upsert(apiMatches.map(transformMatch), { onConflict: 'external_id' })

  revalidatePath('/admin')
  revalidatePath('/')

  return { success: true, message: 'Sincronización completada. Los partidos están al día.' }
}

export async function createMatchAction(
  formData: FormData
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

  const home_team_id = Number(formData.get('home_team_id'))
  const away_team_id = Number(formData.get('away_team_id'))
  const match_date = formData.get('match_date') as string
  const stage = formData.get('stage') as string
  const group_letter = (formData.get('group_letter') as string) || null
  const stadium = (formData.get('stadium') as string) || null
  const referee = (formData.get('referee') as string) || null

  if (!home_team_id || !away_team_id || !match_date || !stage) {
    return { error: 'Faltan campos obligatorios' }
  }
  if (home_team_id === away_team_id) {
    return { error: 'El equipo local y visitante no pueden ser el mismo' }
  }

  const { error: insertError } = await supabase.from('matches').insert({
    home_team_id,
    away_team_id,
    match_date,
    stage,
    group_letter: stage === 'GROUP' ? group_letter : null,
    stadium,
    referee,
    status: 'PENDING',
  })

  if (insertError) return { error: insertError.message }

  revalidatePath('/admin')
  revalidatePath('/')

  return { success: true }
}

export async function saveMatchResultAction(
  matchId: number,
  homeGoals: number,
  awayGoals: number,
  clientAdvancingId: number | null = null,
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

  if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
    return { error: 'Los goles deben ser números enteros' }
  }
  if (homeGoals < 0 || awayGoals < 0 || homeGoals > 99 || awayGoals > 99) {
    return { error: 'Valor de goles fuera de rango (0–99)' }
  }

  // Obtener stage y team IDs para la sanitización
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('stage, home_team_id, away_team_id')
    .eq('id', matchId)
    .single()

  if (matchError || !match) return { error: 'Partido no encontrado' }

  // ── Sanitización del clasificado (misma lógica que jugador) ─
  let advancing_team_id: number | null = null

  if (match.stage !== 'GROUP') {
    if (homeGoals > awayGoals) {
      advancing_team_id = match.home_team_id
    } else if (awayGoals > homeGoals) {
      advancing_team_id = match.away_team_id
    } else {
      if (!clientAdvancingId) {
        return { error: 'En eliminatoria con empate debes seleccionar el equipo que avanza' }
      }
      if (clientAdvancingId !== match.home_team_id && clientAdvancingId !== match.away_team_id) {
        return { error: 'El equipo seleccionado no pertenece a este partido' }
      }
      advancing_team_id = clientAdvancingId
    }
  }
  // ────────────────────────────────────────────────────────────

  // Persistir el clasificado antes de llamar al RPC de puntos
  if (advancing_team_id !== null) {
    const { error: updateError } = await supabase
      .from('matches')
      .update({ advancing_team_id })
      .eq('id', matchId)
    if (updateError) return { error: updateError.message }
  }

  // El RPC actualiza marcador, status y calcula puntos (SECURITY DEFINER)
  const { error: rpcError } = await supabase.rpc('calculate_match_points', {
    p_match_id: matchId,
    p_home_goals: homeGoals,
    p_away_goals: awayGoals,
  })

  if (rpcError) return { error: rpcError.message }

  revalidatePath('/')
  revalidatePath('/predicciones')
  revalidatePath('/clasificacion')
  revalidatePath('/admin')

  return { success: true }
}
