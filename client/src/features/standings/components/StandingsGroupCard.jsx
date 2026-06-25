const TABLE_GRID =
  'grid grid-cols-[1.25rem_minmax(0,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_1.75rem_1.75rem] items-center gap-x-1.5 sm:grid-cols-[2rem_minmax(14rem,1fr)_3rem_3rem_3rem_3rem_3rem_3rem_3rem_4rem_6rem_5rem] sm:gap-x-4';

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

// Derive a normalised status from the FIFA qualificationStatus string + position fallback.
function getTeamStatus(row, index) {
  const s = row.qualificationStatus ?? '';
  if (s.includes('Qualified'))  return 'qualified';   // confirmed through
  if (s.includes('Eliminated')) return 'eliminated';  // confirmed out
  // Positional fallback while the group is still live
  if (index <= 1) return 'advancing';   // likely top 2
  if (index === 2) return 'potential';  // may advance as best third-placed
  return 'unlikely';                    // likely eliminated
}

const LEFT_BAR = {
  qualified:  'bg-emerald-500',
  advancing:  'bg-emerald-400',
  potential:  'bg-blue-400',
  eliminated: 'bg-transparent',
  unlikely:   'bg-transparent',
};

const ROW_BG = {
  qualified:  'sm:bg-emerald-50/40',
  advancing:  'sm:bg-emerald-50/20',
  potential:  'sm:bg-blue-50/20',
  eliminated: '',
  unlikely:   '',
};

export function StandingsGroupCard({ group, animationDelay = 0, onTeamClick }) {
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
        <ColumnHeader className="hidden sm:block">Status</ColumnHeader>
      </div>

      <div className="divide-y divide-slate-200">
        {(group.teams || []).map((row, i) => (
          <TeamRow
            key={row.team?.id ?? `${group.id}-${row.position}-${row.team?.code || i}`}
            row={row}
            index={i}
            delay={animationDelay + 60 + i * 50}
            onClick={onTeamClick ? () => onTeamClick(row, group.name) : undefined}
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

function TeamRow({ row, index, delay, onClick }) {
  const team = row.team || {};
  const mobileTeamName = team.abbreviation || team.code || team.name;
  const status = getTeamStatus(row, index);
  const isOut = status === 'eliminated' || status === 'unlikely';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      className={`animate-fade-slide-in relative ${TABLE_GRID} px-4 py-6 sm:px-5 sm:py-4 ${ROW_BG[status]} ${onClick ? 'cursor-pointer hover:brightness-95 transition-[filter]' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Left qualification bar */}
      <span
        className={`absolute inset-y-0 left-0 w-1 sm:w-0.5 ${LEFT_BAR[status]}`}
        aria-hidden="true"
      />

      <span className={`text-lg font-normal tabular-nums sm:text-sm sm:font-medium ${isOut ? 'text-slate-400' : 'text-slate-950'}`}>
        {row.position}
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <TeamFlag flag={team.flag} name={team.name} code={team.code} dim={isOut} />
        <span className={`truncate text-lg font-medium sm:hidden ${isOut ? 'text-slate-400' : 'text-slate-950'}`}>
          {mobileTeamName}
        </span>
        <span className={`hidden truncate text-sm font-medium sm:inline ${isOut ? 'text-slate-400' : 'text-slate-950'}`}>
          {team.name || team.code}
        </span>
      </div>

      <Stat dim={isOut}>{row.mp}</Stat>
      <Stat dim={isOut}>{row.w}</Stat>
      <Stat dim={isOut}>{row.d}</Stat>
      <Stat dim={isOut}>{row.l}</Stat>
      <Stat dim={isOut} className="hidden sm:block">{row.gf}</Stat>
      <Stat dim={isOut} className="hidden sm:block">{row.ga}</Stat>
      <Stat dim={isOut} className={goalDifferenceClass(row.gd, isOut)}>{formatGoalDifference(row.gd)}</Stat>
      <Stat dim={isOut} className="font-bold">{row.pts}</Stat>
      <FormDots form={row.form} dim={isOut} />
      <StatusBadge status={status} />
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    qualified:  { label: 'Qualified',   cls: 'bg-emerald-100 text-emerald-700' },
    eliminated: { label: 'Eliminated',  cls: 'bg-slate-100 text-slate-400'     },
    potential:  { label: 'Potential Q', cls: 'bg-blue-100 text-blue-600'       },
    advancing:  null,
    unlikely:   null,
  }[status];

  if (!config) return <span className="hidden sm:block" />;

  return (
    <div className="hidden items-center justify-center sm:flex">
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${config.cls}`}>
        {config.label}
      </span>
    </div>
  );
}

function Stat({ children, className = '', dim = false }) {
  return (
    <span className={`text-center text-lg tabular-nums sm:text-sm ${dim ? 'text-slate-400' : 'text-slate-950'} ${className}`}>
      {children}
    </span>
  );
}

function FormDots({ form = [], dim = false }) {
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
            <span key={`pending-${index}`} className={`text-sm leading-none ${dim ? 'text-slate-300' : 'text-slate-500'}`}>
              -
            </span>
          );
        }
        return (
          <span
            key={`${result}-${index}`}
            className={`h-2.5 w-2.5 rounded-full ${dim ? 'opacity-40' : ''} ${FORM_DOT_CLASSES[result] || 'bg-slate-400'}`}
            title={FORM_LABELS[result] || result}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

function TeamFlag({ flag, name, code, dim }) {
  const dimCls = dim ? 'opacity-40' : '';

  if (!flag) {
    return (
      <span className={`grid h-5 w-7 shrink-0 place-items-center rounded-sm border border-slate-100 bg-slate-100 text-[8px] font-bold text-slate-400 ${dimCls}`}>
        {code}
      </span>
    );
  }

  return (
    <img
      src={flag}
      alt={name}
      className={`h-5 w-8 shrink-0 rounded-sm border border-slate-100 object-cover sm:w-7 ${dimCls}`}
      loading="lazy"
    />
  );
}

function formatGoalDifference(value) {
  const goalDifference = Number(value);
  if (!Number.isFinite(goalDifference)) return 0;
  return goalDifference > 0 ? `+${goalDifference}` : goalDifference;
}

function goalDifferenceClass(value, dim) {
  if (dim) return 'text-slate-400';
  const goalDifference = Number(value);
  if (goalDifference > 0) return 'sm:text-emerald-600';
  if (goalDifference < 0) return 'sm:text-red-500';
  return 'sm:text-slate-500';
}
