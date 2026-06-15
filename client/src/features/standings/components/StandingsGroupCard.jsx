const TABLE_GRID =
  'grid grid-cols-[1.25rem_minmax(0,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_1.75rem_1.75rem] items-center gap-x-1.5 sm:grid-cols-[2rem_minmax(14rem,1fr)_3rem_3rem_3rem_3rem_3rem_3rem_3rem_4rem_6rem] sm:gap-x-4';

const FORM_LABELS = {
  W: 'Win',
  D: 'Draw',
  L: 'Loss',
};

const FORM_DOT_CLASSES = {
  W: 'bg-emerald-500',
  D: 'bg-amber-400',
  L: 'bg-red-500',
};

export function StandingsGroupCard({ group, animationDelay = 0 }) {
  const groupTitleId = `standings-${String(group.id || group.name)
    .toLowerCase()
    .replace(/\s+/g, '-')}`;

  return (
    <section
      className="animate-fade-slide-in overflow-hidden rounded-sm border border-slate-200 bg-white"
      style={{ animationDelay: `${animationDelay}ms` }}
      aria-labelledby={groupTitleId}
    >
      <div className={`${TABLE_GRID} border-b border-slate-200 px-4 py-6 sm:px-5 sm:py-4`}>
        <h2
          id={groupTitleId}
          className="col-span-2 truncate text-2xl font-medium text-slate-950 sm:text-2xl"
        >
          {group.name}
        </h2>
        <ColumnHeader>P</ColumnHeader>
        <ColumnHeader>W</ColumnHeader>
        <ColumnHeader>D</ColumnHeader>
        <ColumnHeader>L</ColumnHeader>
        <ColumnHeader className="hidden sm:block">GF</ColumnHeader>
        <ColumnHeader className="hidden sm:block">GA</ColumnHeader>
        <ColumnHeader>GD</ColumnHeader>
        <ColumnHeader>Pts</ColumnHeader>
        <ColumnHeader className="hidden sm:block">Form</ColumnHeader>
      </div>

      <div className="divide-y divide-slate-200">
        {(group.teams || []).map((row, i) => (
          <TeamRow
            key={row.team?.id ?? `${group.id}-${row.position}-${row.team?.code || i}`}
            row={row}
            advances={i < 2}
            delay={animationDelay + 60 + i * 50}
          />
        ))}
      </div>
    </section>
  );
}

function ColumnHeader({ children, className = '' }) {
  return (
    <span className={`text-center text-base font-normal text-slate-700 sm:text-sm sm:font-medium sm:text-slate-600 ${className}`}>
      {children}
    </span>
  );
}

function TeamRow({ row, advances, delay }) {
  const team = row.team || {};
  const mobileTeamName = team.abbreviation || team.code || team.name;

  return (
    <div
      className={`animate-fade-slide-in relative ${TABLE_GRID} px-4 py-6 sm:px-5 sm:py-4 ${
        advances ? 'sm:bg-emerald-50/30' : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {advances && (
        <span className="absolute inset-y-0 left-0 hidden w-0.5 bg-emerald-400 sm:block" aria-hidden="true" />
      )}

      <span className="text-lg font-normal tabular-nums text-slate-950 sm:text-sm sm:font-medium">
        {row.position}
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <TeamFlag flag={team.flag} name={team.name} code={team.code} />
        <span className="truncate text-lg font-medium text-slate-950 sm:hidden">
          {mobileTeamName}
        </span>
        <span className="hidden truncate text-sm font-medium text-slate-950 sm:inline">
          {team.name || team.code}
        </span>
      </div>

      <Stat>{row.mp}</Stat>
      <Stat>{row.w}</Stat>
      <Stat>{row.d}</Stat>
      <Stat>{row.l}</Stat>
      <Stat className="hidden sm:block">{row.gf}</Stat>
      <Stat className="hidden sm:block">{row.ga}</Stat>
      <Stat className={goalDifferenceClass(row.gd)}>{formatGoalDifference(row.gd)}</Stat>
      <Stat className="font-bold text-slate-950">{row.pts}</Stat>
      <FormDots form={row.form} />
    </div>
  );
}

function Stat({ children, className = '' }) {
  return (
    <span className={`text-center text-lg tabular-nums text-slate-950 sm:text-sm ${className}`}>
      {children}
    </span>
  );
}

function FormDots({ form = [] }) {
  const slots = [...(Array.isArray(form) ? form : [])].slice(0, 5);
  while (slots.length < 5) slots.push(null);

  const label = slots.map((result) => FORM_LABELS[result] || 'No result').join(', ');

  return (
    <div
      className="hidden items-center justify-center gap-2 sm:flex"
      aria-label={`Recent form: ${label}`}
    >
      {slots.map((result, index) => {
        if (!result) {
          return (
            <span key={`pending-${index}`} className="text-sm leading-none text-slate-500">
              -
            </span>
          );
        }

        return (
          <span
            key={`${result}-${index}`}
            className={`h-2.5 w-2.5 rounded-full ${FORM_DOT_CLASSES[result] || 'bg-slate-400'}`}
            title={FORM_LABELS[result] || result}
            aria-hidden="true"
          />
        );
      })}
    </div>
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

function formatGoalDifference(value) {
  const goalDifference = Number(value);
  if (!Number.isFinite(goalDifference)) return 0;
  return goalDifference > 0 ? `+${goalDifference}` : goalDifference;
}

function goalDifferenceClass(value) {
  const goalDifference = Number(value);
  if (goalDifference > 0) return 'sm:text-emerald-600';
  if (goalDifference < 0) return 'sm:text-red-500';
  return 'sm:text-slate-500';
}
