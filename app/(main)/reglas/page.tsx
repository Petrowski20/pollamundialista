export const metadata = { title: 'Cómo jugar · PollaMundialista' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
      <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
      {children}
    </section>
  )
}

function ScoreRow({ points, label, description }: { points: string; label: string; description: string }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-50 dark:border-slate-800 last:border-0">
      <span className="shrink-0 w-10 text-center text-lg font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
        {points}
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export default function ReglasPage() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cómo jugar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Todo lo que necesitas saber para ganar la polla.
        </p>
      </div>

      {/* Sistema de puntuación */}
      <Section title="⚽ Sistema de puntuación">
        <ScoreRow
          points="+3"
          label="Resultado exacto"
          description="Aciertas el marcador exacto del partido. Ej: predices 2–1 y el resultado final es 2–1."
        />
        <ScoreRow
          points="+2"
          label="Ganador y diferencia exacta"
          description="Aciertas el equipo ganador (o el empate) y la diferencia de goles exacta, pero fallas el marcador. Ej: predices 2–0, el resultado es 3–1 (ganó el local por 2 goles)."
        />
        <ScoreRow
          points="+1"
          label="Ganador correcto"
          description="Aciertas quién gana (o que habrá empate) pero no el marcador ni la diferencia. Ej: predices 2–0, el resultado es 3–0."
        />
        <ScoreRow
          points="0"
          label="Sin acierto"
          description="El ganador que predijiste no coincide con el resultado real."
        />
        <ScoreRow
          points="0"
          label="Sin predicción"
          description="Si no registras una predicción antes del inicio del partido, no sumas puntos en ese partido."
        />
      </Section>

      {/* Ejemplo práctico */}
      <Section title="📋 Ejemplos — Fase de Grupos">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2.5">
            <span className="text-gray-700 dark:text-gray-300">Predices <strong>2–1</strong> · Real: <strong>2–1</strong></span>
            <span className="font-bold text-green-700 dark:text-green-400">+3 pts</span>
          </div>
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-2.5">
            <span className="text-gray-700 dark:text-gray-300">Predices <strong>2–0</strong> · Real: <strong>3–1</strong> <span className="text-xs text-gray-400">(local gana, dif. +2)</span></span>
            <span className="font-bold text-blue-700 dark:text-blue-400">+2 pts</span>
          </div>
          <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-4 py-2.5">
            <span className="text-gray-700 dark:text-gray-300">Predices <strong>2–0</strong> · Real: <strong>3–0</strong></span>
            <span className="font-bold text-yellow-700 dark:text-yellow-400">+1 pt</span>
          </div>
          <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2.5">
            <span className="text-gray-700 dark:text-gray-300">Predices <strong>1–0</strong> · Real: <strong>0–2</strong></span>
            <span className="font-bold text-red-600 dark:text-red-400">0 pts</span>
          </div>
        </div>
      </Section>

      {/* Fases Eliminatorias */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
        <h2 className="mb-1 text-base font-bold text-gray-900 dark:text-gray-100">
          ⚡ Fases Eliminatorias
          <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-800/60 dark:text-amber-300">
            Dieciseisavos en adelante
          </span>
        </h2>
        <p className="mb-5 text-xs text-gray-500 dark:text-gray-400">
          En eliminación directa aplica la regla del Ganador Absoluto. La escala de puntos (+3, +2, +1) funciona igual que en grupos, pero solo si primero aciertas quién pasa de ronda.
        </p>

        <ul className="space-y-4">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm text-amber-800 dark:bg-amber-800/50 dark:text-amber-200">
              1
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Empates en 120 min</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Si predices un empate, la app te pedirá que elijas qué equipo avanza a la siguiente ronda (como si fuera a penaltis o prórroga). Esa elección forma parte de tu predicción.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700 dark:bg-red-900/40 dark:text-red-400">
              !
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">La Regla de Oro: el clasificado manda</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Si fallas qué equipo pasa de ronda,{' '}
                <strong className="text-red-600 dark:text-red-400">recibes 0 puntos automáticamente</strong>
                , sin importar cuántos goles hayas acertado en el marcador.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm text-green-700 dark:bg-green-900/40 dark:text-green-400">
              ✓
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Si aciertas el clasificado…</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Se aplica la escala normal (+3 exacto · +2 diferencia · +1 solo clasificado) comparando tus goles con el marcador real en los 90/120 minutos.
              </p>
            </div>
          </li>
        </ul>

        {/* Ejemplos eliminatorias */}
        <div className="mt-5 space-y-2 border-t border-amber-100 pt-4 text-sm dark:border-amber-900/30">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ejemplos
          </p>

          {/* Fallo */}
          <div className="rounded-lg bg-red-50 px-4 py-2.5 dark:bg-red-900/20">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-gray-700 dark:text-gray-300">
                  Predices <strong>1–1</strong>{' '}
                  <span className="text-xs text-gray-400">(pasa Equipo A)</span>
                  {' · '}Real: <strong>1–1</strong>{' '}
                  <span className="text-xs text-gray-400">(pasa Equipo B)</span>
                </span>
                <p className="mt-0.5 text-xs text-red-500 dark:text-red-400">
                  Fallaste el clasificado → penalización total
                </p>
              </div>
              <span className="shrink-0 font-bold text-red-600 dark:text-red-400">0 pts</span>
            </div>
          </div>

          {/* Acierto +2 */}
          <div className="rounded-lg bg-blue-50 px-4 py-2.5 dark:bg-blue-900/20">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-gray-700 dark:text-gray-300">
                  Predices <strong>1–1</strong>{' '}
                  <span className="text-xs text-gray-400">(pasa Equipo A)</span>
                  {' · '}Real: <strong>2–2</strong>{' '}
                  <span className="text-xs text-gray-400">(pasa Equipo A)</span>
                </span>
                <p className="mt-0.5 text-xs text-blue-500 dark:text-blue-400">
                  Clasificado ✓ · diferencia (0 = 0) ✓ · marcador exacto ✗
                </p>
              </div>
              <span className="shrink-0 font-bold text-blue-700 dark:text-blue-400">+2 pts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Criterios de desempate */}
      <Section title="🏆 Criterios de desempate">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Si dos o más jugadores tienen los mismos puntos totales, el desempate se aplica en este orden:
        </p>
        <ol className="space-y-3">
          {[
            { num: '1', title: 'Mayor número de resultados exactos (+3)', desc: 'Quien acertó más marcadores exactos a lo largo del torneo.' },
            { num: '2', title: 'Mayor número de ganadores correctos (+1)', desc: 'Quien acertó más veces el signo del partido (1X2).' },
            { num: '3', title: 'Goles predichos más cercanos al total real', desc: 'Se suma la diferencia absoluta entre los goles predichos y los reales en todos los partidos. Menos diferencia = mejor posición.' },
            { num: '4', title: 'Orden de inscripción', desc: 'A igualdad absoluta, tiene prioridad quien se registró antes en la plataforma.' },
          ].map(({ num, title, desc }) => (
            <li key={num} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                {num}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Fases del torneo */}
      <Section title="📅 Fases del torneo">
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {[
            { fase: 'Fase de Grupos', desc: 'Predice los resultados de los 48 partidos de la primera fase.' },
            { fase: 'Octavos de Final', desc: 'Los 32 clasificados se enfrentan en rondas de eliminación directa.' },
            { fase: 'Cuartos, Semifinales y Final', desc: 'Las predicciones valen igual pero el impacto en la clasificación es mayor.' },
          ].map(({ fase, desc }) => (
            <li key={fase} className="flex gap-2.5">
              <span className="text-gray-300 dark:text-slate-600 select-none">—</span>
              <span><strong className="text-gray-900 dark:text-gray-100">{fase}:</strong> {desc}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 border-t border-gray-50 dark:border-slate-800 pt-4">
          El plazo para registrar o modificar una predicción vence en el momento exacto del pitido inicial de cada partido.
        </p>
      </Section>

    </div>
  )
}
