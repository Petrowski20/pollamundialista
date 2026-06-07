'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { savePredictionAction } from '@/app/(main)/actions';
import { getFlagUrl } from '@/utils/getFlagUrl';
import { useLang } from '@/contexts/LangContext';

interface Team {
  name: string;
  flag_emoji: string;
  iso_code?: string;
}

interface MatchCardProps {
  id: number;
  home: Team;
  away: Team;
  homeTeamId: number;
  awayTeamId: number;
  group: string;
  matchStage: string;
  date: string;
  status: 'PENDING' | 'PREDICTED' | 'FINISHED';
  pointsEarned?: number;
  homePrediction?: number;
  awayPrediction?: number;
  predAdvancingTeamId?: number | null;
  realAdvancingTeamId?: number | null;
  homeRealResult?: number;
  awayRealResult?: number;
  isLocked?: boolean;
  stadium?: string | null;
  referee?: string | null;
}

function FlagImg({ flagEmoji, name, isoCode }: { flagEmoji: string; name: string; isoCode?: string }) {
  const url = getFlagUrl(flagEmoji, isoCode);
  if (!url) {
    return (
      <span className="text-2xl leading-none select-none" role="img" aria-label={name}>
        {flagEmoji || '🏳'}
      </span>
    );
  }
  return <img src={url} alt={name} className="w-10 h-7 object-cover rounded-sm shadow-sm" />;
}

function SmallFlag({ flagEmoji, name, isoCode }: { flagEmoji: string; name: string; isoCode?: string }) {
  const url = getFlagUrl(flagEmoji, isoCode);
  if (!url) return <span className="text-sm leading-none">{flagEmoji || '🏳'}</span>;
  return <img src={url} alt={name} className="w-4 h-3 object-cover rounded-sm shrink-0" />;
}

function PointsBadge({ pts }: { pts: number }) {
  if (pts === 0)
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/25 dark:text-red-300 dark:border-red-500/30">0 pts</span>;
  if (pts === 1)
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-orange-500/25 dark:text-orange-300 dark:border-orange-500/30">+1 pt</span>;
  if (pts === 2)
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-yellow-500/25 dark:text-yellow-300 dark:border-yellow-500/30">+2 pts</span>;
  return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 dark:bg-emerald-400/25 dark:text-emerald-300 dark:border-emerald-400/30">+{pts} pts</span>;
}

export default function MatchCard({
  id,
  home,
  away,
  homeTeamId,
  awayTeamId,
  group,
  matchStage,
  date,
  status,
  pointsEarned = 0,
  homePrediction,
  awayPrediction,
  predAdvancingTeamId = null,
  realAdvancingTeamId = null,
  homeRealResult,
  awayRealResult,
  isLocked = false,
  stadium,
  referee,
}: MatchCardProps) {
  const { t } = useLang();

  const initHome = homePrediction?.toString() ?? '';
  const initAway = awayPrediction?.toString() ?? '';

  const [localHome, setLocalHome]               = useState(initHome);
  const [localAway, setLocalAway]               = useState(initAway);
  const [savedHome, setSavedHome]               = useState(initHome);
  const [savedAway, setSavedAway]               = useState(initAway);
  const [localAdvancingId, setLocalAdvancingId] = useState<number | null>(predAdvancingTeamId);
  const [savedAdvancingId, setSavedAdvancingId] = useState<number | null>(predAdvancingTeamId);
  const [isSaving, setIsSaving]                 = useState(false);

  const isKnockout = matchStage !== 'GROUP';
  const isFinished = status === 'FINISHED';

  useEffect(() => {
    if (!isKnockout) return;
    const h = parseInt(localHome, 10);
    const a = parseInt(localAway, 10);
    if (!isNaN(h) && !isNaN(a) && h !== a) setLocalAdvancingId(null);
  }, [localHome, localAway, isKnockout]);

  const isTied        = localHome !== '' && localAway !== '' && localHome === localAway;
  const needsAdvancing = isKnockout && isTied;
  const hasChanged    =
    localHome !== savedHome ||
    localAway !== savedAway ||
    (isKnockout && localAdvancingId !== savedAdvancingId);
  const canSave = hasChanged && !(needsAdvancing && localAdvancingId === null);

  const stageMap: Record<string, string> = {
    GROUP:        t('matchCard.stages.group', { group }),
    ROUND_OF_16:  t('matchCard.stages.round16'),
    QUARTER_FINAL: t('matchCard.stages.quarter'),
    SEMI_FINAL:   t('matchCard.stages.semi'),
    THIRD_PLACE:  t('matchCard.stages.third'),
    FINAL:        t('matchCard.stages.final'),
  };
  const centerLabel = isFinished
    ? t('matchCard.stages.finished')
    : (stageMap[matchStage] ?? matchStage);

  const handleSave = async () => {
    if (localHome === '' || localAway === '') {
      toast.error(t('matchCard.errors.rellenagoles'));
      return;
    }
    if (needsAdvancing && localAdvancingId === null) {
      toast.error(t('matchCard.errors.seleccionapenaltis'));
      return;
    }
    setIsSaving(true);
    const res = await savePredictionAction(
      id,
      parseInt(localHome),
      parseInt(localAway),
      isKnockout ? localAdvancingId : null,
    );
    setIsSaving(false);
    if (res.error) {
      toast.error(t('matchCard.errors.errorPrefix') + res.error);
    } else {
      toast.success(t('matchCard.success'));
      setSavedHome(localHome);
      setSavedAway(localAway);
      setSavedAdvancingId(localAdvancingId);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#FFD6D1] to-[#F9ECE5] dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md overflow-hidden relative border border-[#FFD6D1] dark:border-slate-700 text-gray-900 dark:text-white">

      {/* Header */}
      <div className="bg-white/40 dark:bg-black/20 px-4 py-1.5 grid grid-cols-3 items-center gap-2">
        <span className="text-[10px] text-red-900/70 dark:text-slate-300 uppercase font-bold tracking-wider truncate">
          {referee || t('matchCard.referee')}
        </span>
        <span className="text-[11px] text-gray-900 dark:text-white font-bold uppercase tracking-widest text-center whitespace-nowrap">
          {centerLabel}
        </span>
        <span className="text-[10px] text-red-900/70 dark:text-slate-300 uppercase font-bold tracking-wider text-right truncate">
          {stadium || t('matchCard.stadium')}
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-5 gap-3">

        {/* Local */}
        <div className="flex flex-col items-center gap-2 min-w-0">
          <div className="w-14 h-14 bg-white/60 dark:bg-white/10 rounded-full flex items-center justify-center border border-white dark:border-white/20 shadow-inner">
            <FlagImg flagEmoji={home.flag_emoji} name={home.name} isoCode={home.iso_code} />
          </div>
          <span className="text-xs font-semibold text-gray-800 dark:text-white/90 text-center leading-tight max-w-[80px] line-clamp-2">
            {home.name}
          </span>
        </div>

        {/* Marcador central */}
        <div className="flex-shrink-0">
          {isFinished ? (
            <div className="flex flex-col items-center gap-1">
              <div className="bg-white rounded-xl shadow-inner px-4 py-2 flex items-center gap-2">
                <span className="text-3xl font-black text-slate-900 w-8 text-center tabular-nums">
                  {homeRealResult ?? '?'}
                </span>
                <span className="text-slate-400 font-black text-2xl">-</span>
                <span className="text-3xl font-black text-slate-900 w-8 text-center tabular-nums">
                  {awayRealResult ?? '?'}
                </span>
              </div>

              {isKnockout && homeRealResult === awayRealResult && realAdvancingTeamId !== null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 tracking-wide">
                  🏆 Pen.: {realAdvancingTeamId === homeTeamId ? home.name : away.name}
                </span>
              )}

              {homePrediction !== undefined && (
                <span className="text-[10px] text-gray-500 dark:text-emerald-300/70 tracking-wide">
                  {t('matchCard.tuPred')} {homePrediction}-{awayPrediction}
                  {predAdvancingTeamId !== null && (
                    <> · {t('matchCard.pasa')} {predAdvancingTeamId === homeTeamId ? home.name : away.name}</>
                  )}
                </span>
              )}
              <PointsBadge pts={pointsEarned} />
            </div>
          ) : isLocked ? (
            <div className="flex flex-col items-center gap-1">
              <div className="bg-white/50 dark:bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2 border border-gray-200 dark:border-white/20">
                <span className="text-2xl font-black text-gray-500 dark:text-white/60 w-7 text-center tabular-nums">
                  {savedHome || '?'}
                </span>
                <span className="text-gray-400 dark:text-white/40 font-black text-xl">-</span>
                <span className="text-2xl font-black text-gray-500 dark:text-white/60 w-7 text-center tabular-nums">
                  {savedAway || '?'}
                </span>
              </div>
              {isKnockout && savedHome === savedAway && savedHome !== '' && savedAdvancingId !== null && (
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 tracking-wide">
                  {t('matchCard.pasa')} {savedAdvancingId === homeTeamId ? home.name : away.name}
                </span>
              )}
              <span className="text-[10px] text-gray-500 dark:text-emerald-300/60 tracking-wider">
                {t('matchCard.bloqueado')}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-white/50 dark:border-slate-800 px-2 py-2 flex items-center gap-1">
                <input
                  type="number" min={0} max={99} value={localHome}
                  onChange={(e) => setLocalHome(e.target.value)}
                  onKeyDown={(e) => { if (['e','E','+','-','.',','].includes(e.key)) e.preventDefault(); }}
                  onInput={(e) => { if (e.currentTarget.value.length > 2) e.currentTarget.value = e.currentTarget.value.slice(0, 2); }}
                  disabled={isSaving} placeholder="–"
                  className="w-12 h-12 text-2xl font-black text-center text-slate-900 dark:text-white bg-transparent outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-slate-400 dark:text-slate-500 font-black text-xl px-0.5">-</span>
                <input
                  type="number" min={0} max={99} value={localAway}
                  onChange={(e) => setLocalAway(e.target.value)}
                  onKeyDown={(e) => { if (['e','E','+','-','.',','].includes(e.key)) e.preventDefault(); }}
                  onInput={(e) => { if (e.currentTarget.value.length > 2) e.currentTarget.value = e.currentTarget.value.slice(0, 2); }}
                  disabled={isSaving} placeholder="–"
                  className="w-12 h-12 text-2xl font-black text-center text-slate-900 dark:text-white bg-transparent outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {needsAdvancing && (
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400 dark:text-slate-500">
                    {t('matchCard.penaltis')}
                  </p>
                  <div className="flex gap-2">
                    {([
                      { teamId: homeTeamId, team: home },
                      { teamId: awayTeamId, team: away },
                    ] as const).map(({ teamId, team }) => (
                      <button
                        key={teamId}
                        onClick={() => setLocalAdvancingId(teamId)}
                        disabled={isSaving}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border-2 transition-all ${
                          localAdvancingId === teamId
                            ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                            : 'border-gray-200 dark:border-slate-600 bg-white/60 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      >
                        <SmallFlag flagEmoji={team.flag_emoji} name={team.name} isoCode={team.iso_code} />
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visitante */}
        <div className="flex flex-col items-center gap-2 min-w-0">
          <div className="w-14 h-14 bg-white/60 dark:bg-white/10 rounded-full flex items-center justify-center border border-white dark:border-white/20 shadow-inner">
            <FlagImg flagEmoji={away.flag_emoji} name={away.name} isoCode={away.iso_code} />
          </div>
          <span className="text-xs font-semibold text-gray-800 dark:text-white/90 text-center leading-tight max-w-[80px] line-clamp-2">
            {away.name}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/40 dark:bg-black/20 px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-600 dark:text-emerald-300/60 tracking-wide">{date}</span>

        {!isFinished && !isLocked && (
          canSave ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-[11px] font-bold bg-emerald-400 hover:bg-emerald-300 text-emerald-950 px-3 py-1 rounded-full transition-colors disabled:opacity-60 flex items-center gap-1"
            >
              {isSaving ? t('matchCard.guardando') : t('matchCard.guardar')}
            </button>
          ) : needsAdvancing && localAdvancingId === null ? (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold italic">
              {t('matchCard.seleccionaClasificado')}
            </span>
          ) : savedHome !== '' ? (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              {t('matchCard.guardado')}
            </span>
          ) : (
            <span className="text-[11px] text-gray-400 dark:text-emerald-300/50 italic">
              {t('matchCard.sinPrediccion')}
            </span>
          )
        )}

        {isFinished && (
          <span className="text-[10px] text-gray-500 dark:text-emerald-300/60">
            {t('matchCard.partidoFinalizado')}
          </span>
        )}
        {!isFinished && isLocked && (
          <span className="text-[10px] text-gray-400 dark:text-emerald-300/50">
            {t('matchCard.prediccionesCerradas')}
          </span>
        )}
      </div>

    </div>
  );
}
