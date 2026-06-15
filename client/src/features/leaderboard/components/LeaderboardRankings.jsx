import { useState } from 'react';
import { Podium } from '@/components/ui/Podium';
import { LeaderboardPlayerRow } from './LeaderboardPlayerRow';

export function LeaderboardRankings({ leaderboard, fixturesById, currentUser, maxPoints, onViewStats }) {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:items-start">
      <div className="min-w-0 lg:sticky lg:top-24">
        <Podium rows={leaderboard} currentUser={currentUser} />
      </div>

      <div className="min-w-0 space-y-2">
        {leaderboard.map((row) => {
          const id = row.id || row.username;
          return (
            <LeaderboardPlayerRow
              key={id}
              row={row}
              isOpen={openId === id}
              onToggle={() => toggle(id)}
              fixturesById={fixturesById}
              currentUser={currentUser}
              maxPoints={maxPoints}
              onViewStats={onViewStats}
            />
          );
        })}
      </div>
    </div>
  );
}
