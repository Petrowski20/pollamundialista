'use client';

import { useState } from 'react';
import MatchCard from './MatchCard';
import PredictionModal from './PredictionModal';

export default function MatchGrid({ matches }: { matches: any[] }) {
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  return (
    <>
      <div className="flex flex-col gap-4">
        {matches.map((match) => {
          const formattedDate = new Intl.DateTimeFormat('es-ES', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          }).format(new Date(match.match_date));

          let currentStatus: 'PENDING' | 'PREDICTED' | 'FINISHED' = 'PENDING';
          if (match.status === 'FINISHED') currentStatus = 'FINISHED';
          else if (match.myPred) currentStatus = 'PREDICTED';

          const isLocked = new Date(match.match_date).getTime() - Date.now() < 3600000;

          return (
            <MatchCard
              key={match.id}
              id={match.id}
              home={match.home_team}
              away={match.away_team}
              group={match.group_letter || '?'}
              date={formattedDate}
              status={currentStatus}
              mode="modal"
              isLocked={isLocked || match.status === 'FINISHED'}
              homePrediction={match.myPred?.pred_home_goals}
              awayPrediction={match.myPred?.pred_away_goals}
              onOpenModal={() => setSelectedMatch(match)}
            />
          );
        })}
      </div>

      <PredictionModal
        isOpen={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch}
      />
    </>
  );
}
