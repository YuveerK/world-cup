function formatMatchDateTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.valueOf())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return {
    date: `${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}/${d.getUTCFullYear()}`,
    time: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`,
  };
}

function TeamRow({ team, isWinner, isLive }) {
  const hasScore = team?.score != null;
  const name = team?.name || team?.abbreviation || 'TBD';

  return (
    <div
      className={`flex min-w-0 items-center gap-1.5 px-2 py-1.5 ${
        isWinner ? 'bg-emerald-50' : ''
      }`}
    >
      {team?.flag ? (
        <img
          src={team.flag}
          alt=""
          className="h-3 w-4 shrink-0 rounded-[1px] border border-slate-100 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-3 w-4 shrink-0 rounded-[1px] bg-slate-100" />
      )}
      <span
        className={`flex-1 truncate text-[11px] leading-none ${
          isWinner ? 'font-semibold text-slate-900' : 'text-slate-700'
        }`}
      >
        {name}
      </span>
      {hasScore && (
        <span
          className={`shrink-0 tabular-nums text-[11px] font-bold leading-none ${
            isWinner ? 'text-slate-900' : 'text-slate-500'
          }`}
        >
          {team.score}
          {team.penaltyScore != null && (
            <span className="text-[9px] font-normal text-slate-400"> ({team.penaltyScore})</span>
          )}
        </span>
      )}
      {isLive && !hasScore && (
        <span className="shrink-0 text-[9px] font-bold leading-none text-emerald-500">LIVE</span>
      )}
    </div>
  );
}

export function BracketMatch({ match }) {
  if (!match) {
    return (
      <div className="w-full">
        <div className="overflow-hidden rounded border border-slate-200 bg-white opacity-40">
          <div className="flex min-w-0 items-center gap-1.5 px-2 py-1.5">
            <div className="h-3 w-4 shrink-0 rounded-[1px] bg-slate-100" />
            <span className="flex-1 truncate text-[11px] leading-none text-slate-400">TBD</span>
          </div>
          <div className="border-t border-slate-100" />
          <div className="flex min-w-0 items-center gap-1.5 px-2 py-1.5">
            <div className="h-3 w-4 shrink-0 rounded-[1px] bg-slate-100" />
            <span className="flex-1 truncate text-[11px] leading-none text-slate-400">TBD</span>
          </div>
        </div>
      </div>
    );
  }

  const dt = formatMatchDateTime(match.date);
  const isLive = match.status === 'LIVE';

  return (
    <div className="w-full">
      {dt && (
        <div className="mb-0.5 flex items-center justify-between gap-1 px-0.5">
          <span className="text-[10px] leading-none text-slate-400">{dt.date}</span>
          <span className="text-[10px] leading-none text-slate-400">{dt.time}</span>
        </div>
      )}

      <div
        className={`overflow-hidden rounded border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
          isLive ? 'border-emerald-300' : 'border-slate-200'
        }`}
      >
        <TeamRow team={match.home} isWinner={match.winnerSide === 'home'} isLive={isLive} />
        <div className="border-t border-slate-100" />
        <TeamRow team={match.away} isWinner={match.winnerSide === 'away'} isLive={isLive} />
      </div>

      <a
        href={match.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 block px-0.5 text-[10px] leading-none text-slate-400 underline hover:text-blue-500"
      >
        M{match.matchNumber}
      </a>
    </div>
  );
}
