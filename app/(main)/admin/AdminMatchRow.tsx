'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { finalizeMatchAction } from './actions'

interface Match {
  id: number
  match_date: string
  stage: string
  group_letter: string | null
  matchday: number | null
  status: string
  home_goals: number | null
  away_goals: number | null
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
}

export default function AdminMatchRow({ match }: { match: Match }) {
  const [homeGoals, setHomeGoals] = useState(match.home_goals?.toString() ?? '')
  const [awayGoals, setAwayGoals] = useState(match.away_goals?.toString() ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFinished = match.status === 'FINISHED'

  const handleFinalize = async () => {
    const home = parseInt(homeGoals, 10)
    const away = parseInt(awayGoals, 10)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      toast.error('Introduce un resultado válido (ambos campos, ≥ 0)')
      return
    }

    setIsSubmitting(true)
    const result = await finalizeMatchAction(match.id, home, away)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Partido finalizado: ${home} - ${away} ✓`)
    }
  }

  const date = new Date(match.match_date)
  const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const STAGE_LABELS: Record<string, string> = {
    GROUP: 'Grupos',
    ROUND_OF_32: 'R32',
    ROUND_OF_16: 'Octavos',
    QUARTER_FINAL: 'Cuartos',
    SEMI_FINAL: 'Semis',
    THIRD_PLACE: '3er Puesto',
    FINAL: 'Final',
  }

  return (
    <tr className={`transition-colors hover:bg-gray-50/60 ${isFinished ? 'bg-green-50/40' : ''}`}>
      {/* Fecha */}
      <td className="px-4 py-3 text-sm">
        <span className="font-medium text-gray-800">{dateStr}</span>
        <span className="block text-xs text-gray-400">{timeStr}</span>
      </td>

      {/* Partido */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{match.home_team?.flag_emoji}</span>
          <span className="font-semibold text-gray-900 hidden sm:inline">{match.home_team?.name}</span>
          <span className="text-gray-400 text-xs">vs</span>
          <span className="font-semibold text-gray-900 hidden sm:inline">{match.away_team?.name}</span>
          <span className="text-lg">{match.away_team?.flag_emoji}</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {STAGE_LABELS[match.stage] ?? match.stage}
          {match.group_letter && ` · Grupo ${match.group_letter}`}
          {match.matchday && ` · J${match.matchday}`}
        </div>
      </td>

      {/* Estado */}
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isFinished
            ? 'bg-green-100 text-green-700'
            : match.status === 'IN_PROGRESS'
            ? 'bg-amber-100 text-amber-700'
            : match.status === 'CANCELLED'
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isFinished
            ? `${match.home_goals} - ${match.away_goals}`
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
            className="w-14 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
          />
          <span className="text-gray-300 font-bold">—</span>
          <input
            type="number"
            min="0"
            max="30"
            value={awayGoals}
            onChange={(e) => setAwayGoals(e.target.value)}
            disabled={isSubmitting}
            className="w-14 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>
      </td>

      {/* Botón acción */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={handleFinalize}
          disabled={isSubmitting || isFinished}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
            isFinished
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isSubmitting
              ? 'bg-blue-400 text-white cursor-wait'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Calculando...' : isFinished ? '✓ Listo' : 'Finalizar'}
        </button>
      </td>
    </tr>
  )
}
