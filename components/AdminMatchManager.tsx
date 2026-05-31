'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { syncMatchesAction, saveMatchResultAction } from '@/app/(main)/admin/actions'

interface Team { name: string; flag_emoji: string }

export interface AdminMatch {
  id: number
  match_date: string
  stage: string
  group_letter: string | null
  matchday: number | null
  status: string
  home_goals: number | null
  away_goals: number | null
  home_team: Team | null
  away_team: Team | null
}

const STAGE_LABELS: Record<string, string> = {
  GROUP: 'Grupos',
  ROUND_OF_32: 'R32',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semis',
  THIRD_PLACE: '3er Puesto',
  FINAL: 'Final',
}

function MatchRow({ match }: { match: AdminMatch }) {
  const [homeGoals, setHomeGoals] = useState(match.home_goals?.toString() ?? '')
  const [awayGoals, setAwayGoals] = useState(match.away_goals?.toString() ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFinished = match.status === 'FINISHED'

  const handleSave = async () => {
    const home = parseInt(homeGoals, 10)
    const away = parseInt(awayGoals, 10)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      toast.error('Introduce un resultado válido (ambos campos, número ≥ 0)')
      return
    }

    setIsSubmitting(true)
    const result = await saveMatchResultAction(match.id, home, away)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        `⚽ Puntos calculados: ${match.home_team?.flag_emoji ?? ''} ${home} – ${away} ${match.away_team?.flag_emoji ?? ''}`
      )
    }
  }

  const date = new Date(match.match_date)
  const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const inputBase =
    'w-14 text-center border rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-colors ' +
    'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 ' +
    'disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-slate-700'

  return (
    <tr
      className={`transition-colors hover:bg-gray-50/60 dark:hover:bg-slate-800/40 ${
        isFinished ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
      }`}
    >
      {/* Fecha */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{dateStr}</span>
        <span className="block text-xs text-gray-400 dark:text-gray-500">{timeStr}</span>
      </td>

      {/* Partido */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg leading-none">{match.home_team?.flag_emoji}</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100 hidden sm:inline">
            {match.home_team?.name}
          </span>
          <span className="text-gray-300 dark:text-slate-600 text-xs font-medium">vs</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100 hidden sm:inline">
            {match.away_team?.name}
          </span>
          <span className="text-lg leading-none">{match.away_team?.flag_emoji}</span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {STAGE_LABELS[match.stage] ?? match.stage}
          {match.group_letter && ` · Grupo ${match.group_letter}`}
          {match.matchday && ` · J${match.matchday}`}
        </div>
      </td>

      {/* Estado */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isFinished
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : match.status === 'IN_PROGRESS'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
              : match.status === 'CANCELLED'
              ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
              : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
          }`}
        >
          {isFinished
            ? `${match.home_goals} – ${match.away_goals}`
            : match.status === 'IN_PROGRESS'
            ? 'En curso'
            : match.status === 'CANCELLED'
            ? 'Cancelado'
            : 'Pendiente'}
        </span>
      </td>

      {/* Inputs resultado */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <input
            type="number"
            min="0"
            max="30"
            value={homeGoals}
            onChange={(e) => setHomeGoals(e.target.value)}
            disabled={isSubmitting}
            placeholder="—"
            className={inputBase}
          />
          <span className="text-gray-300 dark:text-slate-600 font-bold text-sm select-none">–</span>
          <input
            type="number"
            min="0"
            max="30"
            value={awayGoals}
            onChange={(e) => setAwayGoals(e.target.value)}
            disabled={isSubmitting}
            placeholder="—"
            className={inputBase}
          />
        </div>
      </td>

      {/* Acción */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={handleSave}
          disabled={isSubmitting || isFinished}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
            isFinished
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
              : isSubmitting
              ? 'opacity-70 cursor-wait bg-gradient-to-r from-brand-blue to-brand-teal text-white'
              : 'bg-gradient-to-r from-brand-blue to-brand-teal text-white hover:opacity-90 shadow-sm'
          }`}
        >
          {isSubmitting ? 'Calculando…' : isFinished ? '✓ Listo' : '💾 Guardar y Calcular'}
        </button>
      </td>
    </tr>
  )
}

export default function AdminMatchManager({ initialMatches }: { initialMatches: AdminMatch[] }) {
  const [isSyncing, setIsSyncing] = useState(false)

  const pending  = initialMatches.filter(m => m.status !== 'FINISHED' && m.status !== 'CANCELLED').length
  const finished = initialMatches.filter(m => m.status === 'FINISHED').length

  const handleSync = async () => {
    setIsSyncing(true)
    const toastId = toast.loading('Sincronizando partidos desde la API…')
    const result = await syncMatchesAction()
    toast.dismiss(toastId)
    setIsSyncing(false)

    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Panel de Administración
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Introduce los resultados reales para calcular puntos automáticamente.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Stat: Pendientes */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl px-4 py-2 text-center min-w-[68px]">
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{pending}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Pendientes</p>
          </div>

          {/* Stat: Finalizados */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-xl px-4 py-2 text-center min-w-[68px]">
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{finished}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Finalizados</p>
          </div>

          {/* Botón Sincronizar */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-blue to-brand-teal text-white hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-wait shadow-sm"
          >
            <span className={isSyncing ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
            {isSyncing ? 'Sincronizando…' : 'Sincronizar desde API'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
              {['Fecha', 'Partido', 'Estado', 'Resultado real', 'Acción'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide first:text-left text-center last:text-center"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {initialMatches.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-gray-400 dark:text-slate-500">
                  No hay partidos en la base de datos.
                </td>
              </tr>
            ) : (
              initialMatches.map((match) => <MatchRow key={match.id} match={match} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
