import { useState } from 'react';
import { BarChart3, ChevronDown } from 'lucide-react';

// FIFA Enhanced Football Intelligence fields, grouped to mirror the match centre.
const STAT_GROUPS = [
  {
    title: 'Attacking',
    defaultOpen: true,
    rows: [{ label: 'Possession', key: 'Possession', fmt: 'pct01' }],
  },
  {
    title: 'Goals',
    defaultOpen: true,
    rows: [
      { label: 'Total', key: 'Goals' },
      { label: 'Conceded', key: 'GoalsConceded' },
      { label: 'Inside the penalty area', key: 'GoalsInsideThePenaltyArea' },
      { label: 'Outside the penalty area', key: 'GoalsOutsideThePenaltyArea' },
      { label: 'Assists', key: 'Assists' },
    ],
  },
  {
    title: 'Attempts at goal',
    defaultOpen: true,
    rows: [
      { label: 'Total', key: 'AttemptAtGoal' },
      { label: 'On target', key: 'AttemptAtGoalOnTarget' },
      { label: 'Off target', key: 'AttemptAtGoalOffTarget' },
      { label: 'Inside the penalty area', key: 'AttemptAtGoalInsideThePenaltyArea' },
      { label: 'Outside the penalty area', key: 'AttemptAtGoalOutsideThePenaltyArea' },
    ],
  },
  {
    title: 'Final third entries',
    rows: [
      { label: 'Left channel', key: 'FinalThirdEntriesReceptionLeftChannel' },
      { label: 'Left inside channel', key: 'FinalThirdEntriesReceptionInsideLeftChannel' },
      { label: 'Central channel', key: 'FinalThirdEntriesReceptionCentralChannel' },
      { label: 'Right inside channel', key: 'FinalThirdEntriesReceptionInsideRightChannel' },
      { label: 'Right channel', key: 'FinalThirdEntriesReceptionRightChannel' },
    ],
  },
  {
    title: 'Offers to receive',
    rows: [
      { label: 'Total', key: 'OffersToReceiveTotal' },
      { label: 'In behind', key: 'OffersToReceiveInBehind' },
      { label: 'In between', key: 'OffersToReceiveInBetween' },
      { label: 'In front', key: 'OffersToReceiveInFront' },
      { label: 'Receptions between midfield and defensive lines', key: 'ReceptionsBetweenMidfieldAndDefensiveLine' },
      { label: 'Receptions behind the defensive line', key: 'ReceptionsInBehind' },
    ],
  },
  {
    title: 'Line breaks',
    rows: [
      { label: 'Attempted line breaks', key: 'LinebreaksAttempted' },
      { label: 'Completed line breaks', key: 'LinebreaksAttemptedCompleted' },
      { label: 'Attempted defensive line breaks', key: 'LinebreaksAttemptedDefensiveLine' },
      { label: 'Completed defensive line breaks', key: 'LinebreaksAttemptedDefensiveLineCompleted' },
    ],
  },
  {
    title: 'Discipline',
    rows: [
      { label: 'Yellow cards', key: 'YellowCards' },
      { label: 'Red cards', key: 'RedCards' },
      { label: 'Fouls against', key: 'FoulsAgainst' },
      { label: 'Offsides', key: 'Offsides' },
    ],
  },
  {
    title: 'Distribution',
    rows: [
      { label: 'Passes', key: 'Passes' },
      { label: 'Passes completed', key: 'PassesCompleted' },
      { label: 'Crosses', key: 'Crosses' },
      { label: 'Crosses completed', key: 'CrossesCompleted' },
      { label: 'Switches of play completed', key: 'CompletedSwitchesOfPlay' },
    ],
  },
  {
    title: 'Set plays',
    rows: [
      { label: 'Corners', key: 'Corners' },
      { label: 'Free kicks', key: 'FreeKicks' },
      { label: 'Penalties scored', key: 'PenaltiesScored' },
    ],
  },
  {
    title: 'Defending',
    rows: [
      { label: 'Own goals', key: 'OwnGoals' },
      { label: 'Forced turnovers', key: 'ForcedTurnovers' },
      { label: 'Pressing applied', key: 'DefensivePressuresApplied' },
    ],
  },
  {
    title: 'Advanced metrics',
    rows: [
      { label: 'Expected goals (xG)', key: 'XG', fmt: 'dec2' },
      { label: 'Threat', key: 'Threat' },
      { label: 'Final-third pitch control', key: 'FinalThirdPitchControl', fmt: 'pctRaw' },
      { label: 'Top speed', key: 'TopSpeed', fmt: 'speed' },
      { label: 'Distance covered', key: 'TotalDistance', fmt: 'km' },
    ],
  },
];

function fmtValue(value, fmt) {
  if (value == null || Number.isNaN(value)) return '–';
  switch (fmt) {
    case 'pct01':
      return `${Math.round(value * 100)}%`;
    case 'pctRaw':
      return `${Math.round(value)}%`;
    case 'dec2':
      return value.toFixed(2);
    case 'speed':
      return `${value.toFixed(1)} km/h`;
    case 'km':
      return `${(value / 1000).toFixed(1)} km`;
    default:
      return `${Math.round(value)}`;
  }
}

function StatRow({ label, home, away, fmt }) {
  const h = typeof home === 'number' ? home : null;
  const a = typeof away === 'number' ? away : null;
  if (h == null && a == null) return null;

  const total = (h || 0) + (a || 0);
  const homePct = total > 0 ? ((h || 0) / total) * 100 : 50;
  const awayPct = 100 - homePct;
  const homeLeads = (h || 0) >= (a || 0);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className={`w-12 shrink-0 font-bold tabular-nums ${homeLeads ? 'text-blue-700' : 'text-slate-500'}`}>
          {fmtValue(h, fmt)}
        </span>
        <span className="flex-1 truncate text-center text-xs font-medium text-slate-500">{label}</span>
        <span className={`w-12 shrink-0 text-right font-bold tabular-nums ${!homeLeads ? 'text-amber-600' : 'text-slate-500'}`}>
          {fmtValue(a, fmt)}
        </span>
      </div>
      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-l-full bg-blue-500/80" style={{ width: `${homePct}%` }} />
        <div className="h-full rounded-r-full bg-amber-400/80" style={{ width: `${awayPct}%` }} />
      </div>
    </div>
  );
}

function StatGroup({ group, home, away }) {
  const [open, setOpen] = useState(Boolean(group.defaultOpen));

  const rows = group.rows.filter((r) => typeof home[r.key] === 'number' || typeof away[r.key] === 'number');
  if (!rows.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-slate-50"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-slate-900">{group.title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="divide-y divide-slate-100 border-t border-slate-100 px-4 pb-3 pt-1">
          {rows.map((r) => (
            <StatRow key={r.key} label={r.label} home={home[r.key]} away={away[r.key]} fmt={r.fmt} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamStatsPanel({ teamStats, homeName, awayName }) {
  const home = teamStats?.home || {};
  const away = teamStats?.away || {};
  if (!Object.keys(home).length && !Object.keys(away).length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-600" aria-hidden="true" />
        <h3 className="text-base font-bold text-slate-950">Team statistics</h3>
        <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
          Enhanced football intelligence
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3 px-1 text-xs font-bold">
        <span className="flex items-center gap-1.5 text-blue-700">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="truncate">{homeName}</span>
        </span>
        <span className="flex items-center gap-1.5 text-amber-600">
          <span className="truncate">{awayName}</span>
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        </span>
      </div>

      <div className="space-y-2.5">
        {STAT_GROUPS.map((group) => (
          <StatGroup key={group.title} group={group} home={home} away={away} />
        ))}
      </div>
    </section>
  );
}
