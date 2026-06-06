'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LangContext'
import { getLeagueMembersAction, kickMemberAction } from '@/app/(main)/ligas/actions'
import { setLastViewedLeague } from '@/app/(main)/clasificacion/actions'
import CopyButton from '@/components/CopyButton'
import LeaveLeagueButton from '@/components/LeaveLeagueButton'

interface League {
  id: number
  name: string
  description: string | null
  join_code: string | null
  created_by: string | null
  joined_at: string
}

interface Member {
  profileId: string
  nickname: string
  avatarUrl: string | null
  joinedAt: string
}

interface Props {
  league: League
  userId: string
}

function MemberAvatar({ url, initial }: { url: string | null; initial: string }) {
  return (
    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
      {url ? (
        <Image src={url} alt={initial} fill sizes="36px" className="object-cover" />
      ) : (
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{initial}</span>
      )}
    </div>
  )
}

export default function LeagueCard({ league, userId }: Props) {
  const { t, lang } = useLang()
  const router = useRouter()
  const isOwner = league.created_by === userId

  const [modalOpen, setModalOpen]     = useState(false)
  const [members, setMembers]         = useState<Member[] | null>(null)
  const [loadingMembers, setLoading]  = useState(false)
  const [kickingId, setKickingId]     = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  const joinedDate = new Date(league.joined_at).toLocaleDateString(
    lang === 'en' ? 'en-US' : 'es-ES',
    { day: '2-digit', month: 'short', year: 'numeric' }
  )

  const openModal = async () => {
    setModalOpen(true)
    if (members !== null) return
    setLoading(true)
    const result = await getLeagueMembersAction(league.id)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      setMembers(result.members ?? [])
    }
  }

  const closeModal = () => setModalOpen(false)

  const handleKick = async (member: Member) => {
    if (!window.confirm(t('leagueDetail.confirmExpulsar', { nickname: member.nickname }))) return
    setKickingId(member.profileId)
    const result = await kickMemberAction(league.id, member.profileId)
    setKickingId(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t('leagueDetail.expulsado', { nickname: member.nickname }))
      setMembers(prev => prev?.filter(m => m.profileId !== member.profileId) ?? null)
    }
  }

  const handleViewStandings = () => {
    startTransition(async () => {
      await setLastViewedLeague(league.id)
      router.push('/clasificacion')
    })
  }

  return (
    <>
      {/* ── Tarjeta ── */}
      <div
        onClick={openModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal() }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[#FFD6D1] dark:border-slate-800 flex flex-col hover:shadow-md hover:border-[#ffbdb5] dark:hover:border-slate-700 transition-all cursor-pointer group"
      >
        {/* Contenido principal */}
        <div className="p-5 flex flex-col gap-3 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {league.name}
            </h3>
            {isOwner && (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {t('ligas.admin')}
              </span>
            )}
          </div>

          {league.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">{league.description}</p>
          )}

          {league.join_code && (
            <div
              className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{t('ligas.code')}</span>
              <span className="font-mono font-bold text-gray-900 dark:text-gray-100 tracking-widest text-sm flex-1">
                {league.join_code}
              </span>
              <CopyButton text={league.join_code} className="text-gray-400 hover:text-blue-600" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 pb-4 pt-1 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-slate-800/50"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{t('ligas.desde', { date: joinedDate })}</span>
          {isOwner ? (
            <span className="text-[10px] text-gray-300 dark:text-slate-600 italic">{t('ligas.ereCreador')}</span>
          ) : (
            <LeaveLeagueButton leagueId={league.id} leagueName={league.name} />
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="fixed inset-x-4 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 flex flex-col bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh]">

            {/* Cabecera */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{league.name}</h2>
                {isOwner && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {t('ligas.admin')}
                  </span>
                )}
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-3 mt-0.5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Lista de miembros (scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400 dark:text-slate-500 gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('leagueDetail.cargando')}
                </div>
              ) : members && members.length > 0 ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-3">
                    {t('leagueDetail.miembros', { n: members.length })}
                  </p>
                  <ul className="space-y-1">
                    {members.map((member) => {
                      const isMe = member.profileId === userId
                      const isCreator = member.profileId === league.created_by
                      const isKicking = kickingId === member.profileId

                      return (
                        <li
                          key={member.profileId}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                            isMe
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <MemberAvatar
                            url={member.avatarUrl}
                            initial={member.nickname.charAt(0).toUpperCase()}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                {member.nickname}
                              </span>
                              {isMe && (
                                <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full leading-none">
                                  {t('leagueDetail.tu')}
                                </span>
                              )}
                              {isCreator && (
                                <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full leading-none">
                                  {t('leagueDetail.creador')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botón expulsar (solo visible para el creador, sobre miembros no-creadores) */}
                          {isOwner && !isCreator && (
                            <button
                              onClick={() => handleKick(member)}
                              disabled={isKicking}
                              title={t('leagueDetail.expulsar')}
                              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                            >
                              {isKicking ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                </svg>
                              )}
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">—</p>
              )}
            </div>

            {/* Footer con CTA */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
              <button
                onClick={handleViewStandings}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('leagueDetail.verClasificacionPending')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {t('leagueDetail.verClasificacion')}
                  </>
                )}
              </button>
            </div>

          </div>
        </>
      )}
    </>
  )
}
