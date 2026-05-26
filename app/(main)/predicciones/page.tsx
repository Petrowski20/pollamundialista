import { createClient } from '@/utils/supabase/server';
import MatchCard from '@/components/MatchCard';

export default async function PrediccionesPage() {
  const supabase = await createClient();

  // 1. Obtenemos el usuario actual
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Pedimos los partidos ordenados por fecha
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, match_date, stage, group_letter, status,
      home_goals, away_goals,
      home_team:teams!home_team_id (name, flag_emoji),
      away_team:teams!away_team_id (name, flag_emoji)
    `)
    .order('match_date', { ascending: true });

  // 3. Pedimos LAS PREDICCIONES de este usuario
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('profile_id', user?.id || '');

  // 4. Creamos un diccionario rápido de predicciones para cruzar datos fácilmente
  const userPredictions = (predictions || []).reduce((acc: any, pred: any) => {
    acc[pred.match_id] = pred;
    return acc;
  }, {});

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Predicciones</h1>
        <p className="text-gray-500 mt-2">
          Rellena tus pronósticos. Recuerda guardar cada partido.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {matches?.map((match) => {
          // Formateamos la fecha
          const formattedDate = new Intl.DateTimeFormat('es-ES', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          }).format(new Date(match.match_date));

          const home = match.home_team as any;
          const away = match.away_team as any;
          
          // Cruzamos los datos con la predicción del usuario
          const myPred = userPredictions[match.id];
          
          // Calculamos el estado para el semáforo
          let currentStatus: 'PENDING' | 'PREDICTED' | 'FINISHED' = 'PENDING';
          if (match.status === 'FINISHED') currentStatus = 'FINISHED';
          else if (myPred) currentStatus = 'PREDICTED';

          // Calculamos si está bloqueado (menos de 1 hora)
          const matchTime = new Date(match.match_date).getTime();
          const isLocked = matchTime - Date.now() < 3600000; // 1 hora en ms

          return (
            <MatchCard
              key={match.id}
              id={match.id}
              home={{ name: home.name, flag_emoji: home.flag_emoji }}
              away={{ name: away.name, flag_emoji: away.flag_emoji }}
              group={match.group_letter || '?'}
              date={formattedDate}
              status={currentStatus}
              mode="inline" // AQUÍ activamos el modo lista que pediste
              isLocked={isLocked || match.status === 'FINISHED'}
              
              // Datos de la predicción (si existen)
              homePrediction={myPred?.pred_home_goals}
              awayPrediction={myPred?.pred_away_goals}
              pointsEarned={myPred?.points_earned}
              
              // Datos reales (si el partido ya terminó)
              homeRealResult={match.home_goals}
              awayRealResult={match.away_goals}
            />
          );
        })}
      </div>
    </div>
  );
}