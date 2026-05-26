'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { savePredictionAction } from '@/app/(main)/predicciones/actions';

// Tipos para mantener TypeScript contento
interface Team {
  name: string;
  flag_emoji: string;
}

interface MatchCardProps {
  id: number;
  home: Team;
  away: Team;
  group: string;
  date: string; // Fecha formateada (ej. "11 jun, 21:00")
  status: 'PENDING' | 'PREDICTED' | 'FINISHED'; // El estado de la predicción
  pointsEarned?: number; // Puntos obtenidos si el partido terminó
  homePrediction?: number; // Predicción del usuario
  awayPrediction?: number;
  homeRealResult?: number; // Resultado oficial
  awayRealResult?: number;
  mode: 'modal' | 'inline'; // 'modal' para Inicio, 'inline' para Predicciones
  isLocked?: boolean; // True si falta menos de 1 hora
  onOpenModal?: (matchId: number) => void; // Función para abrir el modal en Inicio
}

export default function MatchCard({
  id,
  home,
  away,
  group,
  date,
  status,
  pointsEarned = 0,
  homePrediction,
  awayPrediction,
  homeRealResult,
  awayRealResult,
  mode,
  isLocked = false,
  onOpenModal
}: MatchCardProps) {
  const [localHome, setLocalHome] = useState(homePrediction?.toString() || '');
  const [localAway, setLocalAway] = useState(awayPrediction?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  // 1. LÓGICA DEL SEMÁFORO (Tailwind dinámico)
  let cardStyle = "bg-white border-gray-100 hover:shadow-md"; // Por defecto: ⚪ Pendiente
  let pointsBadge = null;

  if (status === 'PREDICTED') {
    cardStyle = "bg-blue-50 border-blue-200"; // 🔵 Pronosticado
  } else if (status === 'FINISHED') {
    if (pointsEarned === 0) {
      cardStyle = "bg-red-50 border-red-200"; // 🔴 Fallo total
      pointsBadge = <span className="text-red-600 font-bold text-xs bg-white px-2 py-1 rounded shadow-sm border border-red-100">0 Pts</span>;
    } else if (pointsEarned === 1) {
      cardStyle = "bg-orange-50 border-orange-200"; // 🟠 Acertó ganador
      pointsBadge = <span className="text-orange-600 font-bold text-xs bg-white px-2 py-1 rounded shadow-sm border border-orange-100">+1 Pt</span>;
    } else if (pointsEarned === 2) {
      cardStyle = "bg-yellow-50 border-yellow-300"; // 🟡 Ganador + Diferencia
      pointsBadge = <span className="text-yellow-600 font-bold text-xs bg-white px-2 py-1 rounded shadow-sm border border-yellow-200">+2 Pts</span>;
    } else if (pointsEarned >= 3) {
      cardStyle = "bg-green-50 border-green-200"; // 🟢 Pleno exacto
      pointsBadge = <span className="text-green-600 font-bold text-xs bg-white px-2 py-1 rounded shadow-sm border border-green-100">+{pointsEarned} Pts</span>;
    }
  }

  // 2. RENDERIZADO DEL INPUT INLINE (Para la pestaña de predicciones)
  const renderInlineInputs = () => {
    if (status === 'FINISHED') {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2 font-bold text-lg text-gray-800">
            <span>{homePrediction}</span><span className="text-gray-400">-</span><span>{awayPrediction}</span>
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            Real: {homeRealResult} - {awayRealResult}
          </span>
        </div>
      );
    }

    const handleInlineSave = async () => {
      if (localHome === '' || localAway === '') return toast.error('Rellena ambos goles');
      setIsSaving(true);
      const res = await savePredictionAction(id, parseInt(localHome), parseInt(localAway));
      setIsSaving(false);

      if (res.error) toast.error('Error: ' + res.error);
      else toast.success('¡Guardado!');
    };

    const hasChanged = localHome !== (homePrediction?.toString() || '') ||
                       localAway !== (awayPrediction?.toString() || '');

    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <input
            type="number" min="0" value={localHome} disabled={isLocked || isSaving}
            onChange={(e) => setLocalHome(e.target.value)}
            className="w-10 h-10 text-center font-bold text-gray-700 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
          />
          <span className="text-gray-400 font-medium">-</span>
          <input
            type="number" min="0" value={localAway} disabled={isLocked || isSaving}
            onChange={(e) => setLocalAway(e.target.value)}
            className="w-10 h-10 text-center font-bold text-gray-700 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
          />
        </div>
        {hasChanged && !isLocked && (
          <button
            onClick={handleInlineSave} disabled={isSaving}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-700 transition-colors"
          >
            {isSaving ? '⏳' : '💾 Guardar'}
          </button>
        )}
      </div>
    );
  };

  // 3. RENDERIZADO PRINCIPAL
  return (
    <div className={`rounded-xl shadow-sm border p-4 transition-all flex flex-col relative ${cardStyle}`}>
      
      {/* Candado si está bloqueado */}
      {isLocked && status !== 'FINISHED' && (
        <div className="absolute top-4 right-4 text-gray-400 text-sm" title="Partido bloqueado (menos de 1h)">
          🔒
        </div>
      )}

      {/* Cabecera */}
      <div className="flex justify-between items-center mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span>Grupo {group}</span>
        <span>{date}</span>
      </div>

      <div className="flex items-center justify-between">
        {/* Lado izquierdo: Equipos */}
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{home.flag_emoji}</span>
            <span className="font-medium text-gray-900">{home.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{away.flag_emoji}</span>
            <span className="font-medium text-gray-900">{away.name}</span>
          </div>
        </div>

        {/* Lado derecho: Interacción o Badge */}
        <div className="flex flex-col items-end justify-center">
          {mode === 'inline' && renderInlineInputs()}
          {pointsBadge && <div className="mt-2">{pointsBadge}</div>}
        </div>
      </div>
      
      {/* Pie de tarjeta para el modo Modal (Pantalla Inicio) */}
      {mode === 'modal' && status !== 'FINISHED' && (
        <div className="mt-5 pt-4 border-t border-gray-100/50">
          <button 
            onClick={() => onOpenModal && onOpenModal(id)}
            disabled={isLocked}
            className="w-full text-center text-sm font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 hover:text-blue-800"
          >
            {isLocked ? 'Cerrado para votar' : (status === 'PREDICTED' ? 'Editar predicción ✏️' : 'Añadir predicción +')}
          </button>
        </div>
      )}

    </div>
  );
}