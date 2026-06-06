'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { setLastViewedLeague } from '@/app/(main)/clasificacion/actions'
import { useLang } from '@/contexts/LangContext'

interface League {
  id: number
  name: string
}

interface LeagueSelectorProps {
  leagues: League[]
  activeLeagueId: number | null
}

export default function LeagueSelector({ leagues, activeLeagueId }: LeagueSelectorProps) {
  const [pending, setPending] = useState(false)
  const { t } = useLang()

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const leagueId = value === 'global' ? null : parseInt(value)
    setPending(true)
    const res = await setLastViewedLeague(leagueId)
    setPending(false)
    if (res.error) toast.error(t('leagueSelector.error') + res.error)
  }

  return (
    <div className="flex items-center gap-3 mb-6">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">
        {t('leagueSelector.label')}
      </label>
      <select
        key={activeLeagueId ?? 'global'}
        defaultValue={activeLeagueId?.toString() ?? 'global'}
        onChange={handleChange}
        disabled={pending}
        className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition-opacity"
      >
        <option value="global">{t('leagueSelector.global')}</option>
        {leagues.map((league) => (
          <option key={league.id} value={league.id.toString()}>
            🏆 {league.name}
          </option>
        ))}
      </select>
      {pending && (
        <span className="text-xs text-gray-400 animate-pulse">{t('leagueSelector.guardando')}</span>
      )}
    </div>
  )
}
