'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createLeagueAction, joinLeagueAction } from '@/app/(main)/ligas/actions'
import { useLang } from '@/contexts/LangContext'

type Tab = 'create' | 'join'

export default function LeagueManager() {
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState<Tab>('create')

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating]   = useState(false)

  const [code, setCode]         = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error(t('leagueManager.errors.nombreObligatorio')); return }

    setIsCreating(true)
    const result = await createLeagueAction(name.trim(), description.trim())
    setIsCreating(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t('leagueManager.created', { code: result.join_code! }), { duration: 6000 })
      setName('')
      setDescription('')
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { toast.error(t('leagueManager.errors.codigoObligatorio')); return }

    setIsJoining(true)
    const result = await joinLeagueAction(trimmed)
    setIsJoining(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t('leagueManager.joined', { name: result.leagueName! }))
      setCode('')
    }
  }

  const tabs: [Tab, string][] = [
    ['create', t('leagueManager.tabCrear')],
    ['join',   t('leagueManager.tabUnirse')],
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[#FFD6D1] dark:border-slate-800 overflow-hidden">
      {/* Pestañas */}
      <div className="flex border-b border-[#FFD6D1] dark:border-slate-800">
        {tabs.map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-[#FFD6D1]/20 dark:bg-slate-800/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('leagueManager.nombre')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Los del Bar, Peñeta 2026…"
                maxLength={60}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('leagueManager.descripcion')}{' '}
                <span className="text-xs font-normal text-gray-400">{t('leagueManager.opcional')}</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={200}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="mt-1 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isCreating ? t('leagueManager.creando') : t('leagueManager.crear')}
            </button>
          </form>
        )}

        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="flex flex-col items-center gap-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {t('leagueManager.joinHint')}
            </p>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="X7K9PQ"
              maxLength={8}
              spellCheck={false}
              autoComplete="off"
              className="w-48 text-center text-3xl font-bold tracking-[0.3em] uppercase border-2 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:tracking-normal placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:text-2xl"
            />

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isJoining ? t('leagueManager.uniendome') : t('leagueManager.unirseBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
