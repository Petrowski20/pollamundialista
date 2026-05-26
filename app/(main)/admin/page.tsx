import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminMatchRow from './AdminMatchRow'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') redirect('/')

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id, match_date, stage, group_letter, matchday, status, home_goals, away_goals,
      home_team:teams!home_team_id (name, flag_emoji),
      away_team:teams!away_team_id (name, flag_emoji)
    `)
    .order('match_date', { ascending: true })

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error cargando partidos: {error.message}</p>
      </div>
    )
  }

  const pending  = matches?.filter(m => m.status !== 'FINISHED' && m.status !== 'CANCELLED').length ?? 0
  const finished = matches?.filter(m => m.status === 'FINISHED').length ?? 0

  return (
    <div className="w-full">
      {/* Cabecera */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">Introduce los resultados reales para calcular puntos automáticamente.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-center">
            <p className="text-xl font-bold text-amber-700">{pending}</p>
            <p className="text-xs text-amber-600">Pendientes</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-2 text-center">
            <p className="text-xl font-bold text-green-700">{finished}</p>
            <p className="text-xs text-green-600">Finalizados</p>
          </div>
        </div>
      </div>

      {/* Tabla de partidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Partido</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Resultado real</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {matches?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  No hay partidos en la base de datos.
                </td>
              </tr>
            ) : (
              matches?.map((match) => (
                <AdminMatchRow key={match.id} match={match as any} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
