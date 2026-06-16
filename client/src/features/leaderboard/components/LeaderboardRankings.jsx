import { useState } from 'react';
import { Podium } from '@/components/ui/Podium';
import { LeaderboardPlayerRow } from './LeaderboardPlayerRow';

export function LeaderboardRankings({ leaderboard, fixturesById, currentUser, maxPoints, onViewStats }) {
  const [openId, setOpenId] = useState(null);
  const [closingId, setClosingId] = useState(null);

  const toggle = (id) => {
    setOpenId((prev) => {
      if (prev !== null) {
        setClosingId(prev);
        setTimeout(() => setClosingId(null), 310);
      }
      return prev === id ? null : id;
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:items-start">
      <div className="min-w-0 lg:sticky lg:top-24">
        <Podium rows={leaderboard} currentUser={currentUser} />
      </div>

      <div className="min-w-0 space-y-2">
        {leaderboard.map((row) => {
          const id = row.id || row.username;
          const isCurrentUser = row.username === currentUser?.username;
          return (
            <div key={id} className={isCurrentUser ? `z-10 rounded-xl shadow-md${openId === id || closingId === id ? '' : ' sticky bottom-4'}` : undefined}>
              <LeaderboardPlayerRow
                row={row}
                isOpen={openId === id}
                onToggle={() => toggle(id)}
                fixturesById={fixturesById}
                currentUser={currentUser}
                leaderboard={leaderboard}
                maxPoints={maxPoints}
                onViewStats={onViewStats}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
