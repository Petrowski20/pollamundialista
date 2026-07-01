'use client'

import { useMemo, useState } from 'react'
import { getFlagUrl } from '@/utils/getFlagUrl'

interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
}

export interface MatchWithVoters {
  id: number
  match_date: string
  stage: string
  group_letter: string | null
  status: string
  home_goals: number | null
  away_goals: number | null
  isLocked: boolean
  home_team: { name: string; flag_emoji: string } | null
  away_team: { name: string; flag_emoji: string } | null
  hanVotado: Profile[]
  faltanPorVotar: Profile[]
}

const STAGE_LABELS: Record<string, string> = {
  GROUP:         'Grupos',
  ROUND_OF_32:   'R32',
  ROUND_OF_16:   'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL:    'Semis',
  THIRD_PLACE:   '3er Puesto',
  FINAL:         'Final',
}

type Category = 'por-jugar' | 'bloqueado' | 'jugado'
type Filter = 'todos' | Category

const FILTER_LABELS: Record<Filter, string> = {
  todos:       'Todos',
  'por-jugar': 'Por jugar',
  bloqueado:   'Bloqueados',
  jugado:      'Jugados',
}

function getCategory(match: MatchWithVoters): Category {
  if (match.status === 'FINISHED' || match.status === 'CANCELLED') return 'jugado'
  if (match.isLocked) return 'bloqueado'
  return 'por-jugar'
}

function matchLabel(match: MatchWithVoters) {
  return `${match.home_team?.name ?? '?'} vs ${match.away_team?.name ?? '?'}`
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr)
  const dateFmt = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeFmt = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${dateFmt} a las ${timeFmt}`
}

function Avatar({ profile }: { profile: Profile }) {
  const initials = (profile.nickname ?? '?').slice(0, 2).toUpperCase()

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.nickname ?? ''}
        className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-white dark:border-slate-800"
      />
    )
  }

  return (
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-blue to-brand-teal flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 border border-white dark:border-slate-800">
      {initials}
    </div>
  )
}

function buildWhatsAppUrl(matchLbl: string, missingNames: string[]): string {
  const appUrl = window.location.origin
  const names = missingNames.join(', ')
  const text =
    `⚽ ¡Poned la porra, vagos!\n\n` +
    `El partido *${matchLbl}* empieza pronto y aún no habéis votado:\n` +
    `👤 ${names}\n\n` +
    `Entrad ya a poner vuestra predicción: ${appUrl}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/** Panel superior: agrega, por jugador, los partidos aún abiertos que le faltan por votar. */
function MissingVotersPanel({ matches }: { matches: MatchWithVoters[] }) {
  const openMissing = useMemo(() => {
    const byPlayer = new Map<string, { profile: Profile; matches: string[] }>()
    for (const match of matches) {
      if (getCategory(match) !== 'por-jugar') continue
      for (const p of match.faltanPorVotar) {
        if (!byPlayer.has(p.id)) byPlayer.set(p.id, { profile: p, matches: [] })
        byPlayer.get(p.id)!.matches.push(matchLabel(match))
      }
    }
    return Array.from(byPlayer.values()).sort((a, b) => b.matches.length - a.matches.length)
  }, [matches])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
      <div className="bg-red-50 dark:bg-red-900/20 px-5 py-3 border-b border-red-100 dark:border-red-800/40 flex items-center gap-2">
        <span>❌</span>
        <h2 className="text-sm font-bold text-red-700 dark:text-red-400">No votado</h2>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
          {openMissing.length}
        </span>
      </div>

      {openMissing.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 italic px-5 py-6 text-center">
          🎉 Todos están al día con los partidos que aún se pueden votar.
        </p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {openMissing.map(({ profile, matches: labels }) => (
            <div key={profile.id} className="px-5 py-3 flex items-start gap-3">
              <Avatar profile={profile} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {profile.nickname ?? 'Sin nombre'}
                  <span className="ml-2 text-xs font-normal text-gray-400 dark:text-slate-500">
                    {labels.length} partido{labels.length !== 1 ? 's' : ''} pendiente{labels.length !== 1 ? 's' : ''}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {labels.map((lbl, i) => (
                    <span
                      key={i}
                      className="text-[11px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 px-2 py-0.5 rounded-md"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Modal con el detalle de quién ha votado y quién no para un partido concreto. */
function VotersModal({ match, onClose }: { match: MatchWithVoters; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gray-50 dark:bg-slate-800/60 px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Estado de votación</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{matchLabel(match)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold px-2 leading-none ml-4"
          >
            ×
          </button>
        </div>

        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-slate-800 max-h-[28rem] overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span>✅</span>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Han votado</h4>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                {match.hanVotado.length}
              </span>
            </div>
            {match.hanVotado.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 italic">Nadie ha votado aún.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {match.hanVotado.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-full px-2.5 py-1"
                  >
                    <Avatar profile={p} />
                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-none">
                      {p.nickname ?? 'Sin nombre'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span>❌</span>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">No han votado</h4>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                match.faltanPorVotar.length === 0
                  ? 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                {match.faltanPorVotar.length}
              </span>
            </div>
            {match.faltanPorVotar.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 italic">¡Todos han votado! 🎉</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {match.faltanPorVotar.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-lg px-3 py-1.5"
                  >
                    <Avatar profile={p} />
                    <span className="text-xs font-medium text-red-800 dark:text-red-300">
                      {p.nickname ?? 'Sin nombre'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchRow({ match, onViewVoters }: { match: MatchWithVoters; onViewVoters: (m: MatchWithVoters) => void }) {
  const homeLabel = match.home_team?.name ?? '?'
  const awayLabel = match.away_team?.name ?? '?'
  const category = getCategory(match)
  const stageLabel = STAGE_LABELS[match.stage] ?? match.stage
  const groupSuffix = match.group_letter ? ` · Grupo ${match.group_letter}` : ''
  const missingNames = match.faltanPorVotar.map((p) => p.nickname ?? 'Sin nombre')

  const statusBadge = category === 'jugado'
    ? {
        cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
        label: match.status === 'CANCELLED' ? 'Cancelado' : `${match.home_goals ?? '-'} – ${match.away_goals ?? '-'}`,
      }
    : category === 'bloqueado'
    ? { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', label: 'Bloqueado' }
    : { cls: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400', label: 'Por jugar' }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 px-5 py-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {match.home_team?.flag_emoji && getFlagUrl(match.home_team.flag_emoji)
          ? <img src={getFlagUrl(match.home_team.flag_emoji)} alt={homeLabel} className="w-7 h-5 object-cover rounded-sm shadow-sm flex-shrink-0" />
          : null}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {homeLabel} vs {awayLabel}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {stageLabel}{groupSuffix} &middot; {formatDateTime(match.match_date)}
          </p>
        </div>
        {match.away_team?.flag_emoji && getFlagUrl(match.away_team.flag_emoji)
          ? <img src={getFlagUrl(match.away_team.flag_emoji)} alt={awayLabel} className="w-7 h-5 object-cover rounded-sm shadow-sm flex-shrink-0" />
          : null}
      </div>

      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${statusBadge.cls}`}>
        {statusBadge.label}
      </span>

      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
        ✅ {match.hanVotado.length}
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 shrink-0">
        ❌ {match.faltanPorVotar.length}
      </span>

      <button
        onClick={() => onViewVoters(match)}
        className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors shrink-0"
      >
        👁 Ver votos
      </button>

      {category === 'por-jugar' && match.faltanPorVotar.length > 0 && (
        <button
          onClick={() =>
            window.open(buildWhatsAppUrl(matchLabel(match), missingNames), '_blank', 'noopener,noreferrer')
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white transition-all active:scale-95 shadow-sm whitespace-nowrap shrink-0"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Avisar
        </button>
      )}
    </div>
  )
}

export default function RemindersView({ matches }: { matches: MatchWithVoters[] }) {
  const [filter, setFilter]         = useState<Filter>('todos')
  const [modalMatch, setModalMatch] = useState<MatchWithVoters | null>(null)

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { todos: matches.length, 'por-jugar': 0, bloqueado: 0, jugado: 0 }
    for (const m of matches) c[getCategory(m)]++
    return c
  }, [matches])

  const filtered = filter === 'todos' ? matches : matches.filter((m) => getCategory(m) === filter)

  return (
    <div className="w-full space-y-6">

      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Recordatorios
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Estado de votación de los {matches.length} partido{matches.length !== 1 ? 's' : ''} del torneo.
        </p>
      </div>

      {/* Panel "No votado" */}
      <MissingVotersPanel matches={matches} />

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === f
                ? 'bg-brand-blue border-brand-blue text-white dark:bg-brand-teal dark:border-brand-teal'
                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {FILTER_LABELS[f]} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Estado vacío */}
      {filtered.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-14 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No hay partidos en esta categoría</p>
        </div>
      )}

      {/* Lista de partidos */}
      <div className="space-y-2.5">
        {filtered.map((match) => (
          <MatchRow key={match.id} match={match} onViewVoters={setModalMatch} />
        ))}
      </div>

      {modalMatch && (
        <VotersModal match={modalMatch} onClose={() => setModalMatch(null)} />
      )}
    </div>
  )
}
