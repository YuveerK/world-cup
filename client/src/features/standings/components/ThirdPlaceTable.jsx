const TABLE_GRID =
  'grid grid-cols-[1.5rem_minmax(0,1fr)_2.5rem_2.5rem_5rem] items-center gap-x-2 sm:grid-cols-[2rem_minmax(0,1fr)_5rem_3rem_3rem_3rem_3rem_3rem_3rem_3rem_3rem_5rem] sm:gap-x-4';

export function ThirdPlaceTable({ teams = [], animationDelay = 0 }) {
  if (!teams.length) return null;

  return (
    <section
      className="animate-fade-slide-in overflow-hidden rounded-sm border border-slate-200 bg-white"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-bold text-slate-900">Best Third-Placed Teams</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          The top 8 of 12 third-placed teams advance to the Round of 32. Ranked by points, goal difference, goals scored, then fair play.
        </p>
      </div>

      {/* Column headers */}
      <div className={`${TABLE_GRID} border-b border-slate-100 px-4 py-2 sm:px-5`}>
        <span />
        <span />
        <ColumnHeader className="hidden sm:block">Group</ColumnHeader>
        <ColumnHeader className="hidden sm:block">P</ColumnHeader>
        <ColumnHeader className="hidden sm:block">W</ColumnHeader>
        <ColumnHeader className="hidden sm:block">D</ColumnHeader>
        <ColumnHeader className="hidden sm:block">L</ColumnHeader>
        <ColumnHeader className="hidden sm:block">GF</ColumnHeader>
        <ColumnHeader className="hidden sm:block">GA</ColumnHeader>
        <ColumnHeader>GD</ColumnHeader>
        <ColumnHeader>Pts</ColumnHeader>
        <span />
      </div>

      <div className="divide-y divide-slate-100">
        {teams.map((entry, i) => (
          <ThirdPlaceRow
            key={entry.team?.id ?? i}
            entry={entry}
            delay={animationDelay + 60 + i * 40}
          />
        ))}
      </div>

      <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
        <p className="text-[11px] text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500 align-middle" aria-hidden="true" />{' '}
          Advances to Round of 32 &nbsp;·&nbsp; Fair play (conduct score) used as 4th tiebreaker
        </p>
      </div>
    </section>
  );
}

function ThirdPlaceRow({ entry, delay }) {
  const team = entry.team || {};
  const advances = entry.advances;
  const confirmed = entry.qualificationStatus === 'ConfirmedQualified';

  return (
    <div
      className={`animate-fade-slide-in relative ${TABLE_GRID} px-4 py-3 sm:px-5 sm:py-4 ${
        advances ? 'sm:bg-blue-50/20' : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {advances && (
        <span className="absolute inset-y-0 left-0 hidden w-0.5 bg-blue-400 sm:block" aria-hidden="true" />
      )}

      <span className="text-sm font-semibold tabular-nums text-slate-500">{entry.rank}</span>

      <div className="flex min-w-0 items-center gap-2.5">
        <TeamFlag flag={team.flag} name={team.name} code={team.code} />
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900 sm:hidden">
            {team.abbreviation || team.code}
          </span>
          <span className="hidden truncate text-sm font-semibold text-slate-900 sm:block">
            {team.name || team.code}
          </span>
          <span className="block text-[10px] text-slate-400 sm:hidden">{entry.group}</span>
        </div>
      </div>

      <span className="hidden text-center text-sm text-slate-500 sm:block">{entry.group?.replace('Group ', '')}</span>
      <Stat className="hidden sm:block">{entry.mp}</Stat>
      <Stat className="hidden sm:block">{entry.w}</Stat>
      <Stat className="hidden sm:block">{entry.d}</Stat>
      <Stat className="hidden sm:block">{entry.l}</Stat>
      <Stat className="hidden sm:block">{entry.gf}</Stat>
      <Stat className="hidden sm:block">{entry.ga}</Stat>
      <Stat className={gdClass(entry.gd)}>{formatGd(entry.gd)}</Stat>
      <Stat className="font-bold text-slate-950">{entry.pts}</Stat>

      <div className="flex justify-end">
        {advances ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              confirmed
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {confirmed ? 'Confirmed' : 'Qualifying'}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-300">—</span>
        )}
      </div>
    </div>
  );
}

function ColumnHeader({ children, className = '' }) {
  return (
    <span className={`text-center text-xs font-medium text-slate-500 ${className}`}>
      {children}
    </span>
  );
}

function Stat({ children, className = '' }) {
  return (
    <span className={`text-center text-sm tabular-nums text-slate-700 ${className}`}>
      {children}
    </span>
  );
}

function TeamFlag({ flag, name, code }) {
  if (!flag) {
    return (
      <span className="grid h-5 w-7 shrink-0 place-items-center rounded-sm border border-slate-100 bg-slate-100 text-[8px] font-bold text-slate-400">
        {code}
      </span>
    );
  }
  return (
    <img
      src={flag}
      alt={name}
      className="h-5 w-8 shrink-0 rounded-sm border border-slate-100 object-cover sm:w-7"
      loading="lazy"
    />
  );
}

function formatGd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n > 0 ? `+${n}` : n;
}

function gdClass(value) {
  const n = Number(value);
  if (n > 0) return 'sm:text-emerald-600';
  if (n < 0) return 'sm:text-red-500';
  return 'sm:text-slate-500';
}
