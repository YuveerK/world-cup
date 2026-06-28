import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useKnockout } from '../hooks/useKnockout';

// ─── Bracket math ─────────────────────────────────────────────────────────────

function siblingSlot(slot) {
  return slot % 2 === 1 ? slot + 1 : slot - 1;
}

function r32SlotsForR16(r16Slot) {
  if (r16Slot <= 4) return [r16Slot * 2 - 1, r16Slot * 2];
  return [(r16Slot - 4) * 2 + 7, (r16Slot - 4) * 2 + 8];
}

function r32SlotsForQF(qfSlot) {
  const r16Slots =
    qfSlot <= 2
      ? [qfSlot * 2 - 1, qfSlot * 2]
      : [(qfSlot - 2) * 2 + 3, (qfSlot - 2) * 2 + 4];
  return r16Slots.flatMap(r32SlotsForR16);
}

function r32SlotsForSF(sfSlot) {
  return sfSlot === 1 ? [1, 2, 3, 4, 5, 6, 7, 8] : [9, 10, 11, 12, 13, 14, 15, 16];
}

// ─── Path builder ─────────────────────────────────────────────────────────────

function buildPath(rounds, teamId) {
  if (!rounds?.length || !teamId) return null;

  const byKey = new Map(rounds.map((r) => [r.key, r.matches || []]));
  const r32All = byKey.get('round-of-32') || [];

  const myR32 = r32All.find((m) => m.home?.id === teamId || m.away?.id === teamId);
  if (!myR32) return null;

  const s = myR32.bracketSlot;
  const isLeft = s <= 8;

  let r16Slot, qfSlot, sfSlot;
  if (isLeft) {
    r16Slot = Math.ceil(s / 2);
    qfSlot  = Math.ceil(r16Slot / 2);
    sfSlot  = 1;
  } else {
    r16Slot = 4 + Math.ceil((s - 8) / 2);
    qfSlot  = 2 + Math.ceil((r16Slot - 4) / 2);
    sfSlot  = 2;
  }

  function r32Teams(slots) {
    return slots.flatMap((slot) => {
      const m = r32All.find((match) => match.bracketSlot === slot);
      return m ? [m.home, m.away].filter(Boolean) : [];
    });
  }

  function teamStatus(match) {
    if (!match) return 'tbd';
    const isHome = match.home?.id === teamId;
    const isAway = match.away?.id === teamId;
    if (!isHome && !isAway) return 'tbd';
    if (match.status === 'LIVE') return 'live';
    if (!match.winnerSide) return 'upcoming';
    if ((isHome && match.winnerSide === 'home') || (isAway && match.winnerSide === 'away')) return 'won';
    return 'lost';
  }

  const findMatch = (key, slot) =>
    (byKey.get(key) || []).find((m) => m.bracketSlot === slot) ?? null;

  const r32Status = teamStatus(myR32);
  let out = false;

  function nextStatus(match) {
    if (out) return 'eliminated';
    const st = teamStatus(match);
    if (st === 'lost') out = true;
    return st;
  }

  const r16Match = findMatch('round-of-16', r16Slot);
  const qfMatch  = findMatch('quarter-finals', qfSlot);
  const sfMatch  = findMatch('semi-finals', sfSlot);
  const finMatch = findMatch('final', 1);

  if (r32Status === 'lost') out = true;

  return [
    {
      roundLabel: 'Round of 32',
      match: myR32,
      status: r32Status,
      potentialOpponents: [],
      showActual: true,
    },
    {
      roundLabel: 'Round of 16',
      match: r16Match,
      status: nextStatus(r16Match),
      potentialOpponents: r32Teams([siblingSlot(s)]),
      showActual: !!(r16Match?.home?.id && r16Match?.away?.id),
    },
    {
      roundLabel: 'Quarter-final',
      match: qfMatch,
      status: nextStatus(qfMatch),
      potentialOpponents: r32Teams(r32SlotsForR16(siblingSlot(r16Slot))),
      showActual: !!(qfMatch?.home?.id && qfMatch?.away?.id),
    },
    {
      roundLabel: 'Semi-final',
      match: sfMatch,
      status: nextStatus(sfMatch),
      potentialOpponents: r32Teams(r32SlotsForQF(siblingSlot(qfSlot))),
      showActual: !!(sfMatch?.home?.id && sfMatch?.away?.id),
    },
    {
      roundLabel: 'Final',
      match: finMatch,
      status: nextStatus(finMatch),
      potentialOpponents: r32Teams(r32SlotsForSF(sfSlot === 1 ? 2 : 1)),
      showActual: !!(finMatch?.home?.id && finMatch?.away?.id),
    },
  ];
}

function extractR32Teams(rounds) {
  const r32 = (rounds || []).find((r) => r.key === 'round-of-32');
  if (!r32) return [];
  const seen = new Set();
  const teams = [];
  for (const match of r32.matches || []) {
    for (const side of ['home', 'away']) {
      const t = match[side];
      if (t?.id && !seen.has(t.id)) {
        seen.add(t.id);
        teams.push({ id: t.id, name: t.name, flag: t.flag });
      }
    }
  }
  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

function fmtDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.valueOf())) return null;
  return d.toLocaleDateString('en-GB', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) + ' UTC';
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  won:       { label: 'Won',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  lost:      { label: 'Eliminated', cls: 'bg-rose-50 text-rose-600 border-rose-200' },
  live:      { label: 'Live',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  upcoming:  { label: 'Upcoming',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  tbd:       { label: 'TBD',        cls: 'bg-slate-50 text-slate-500 border-slate-200' },
  eliminated:{ label: 'Path ends',  cls: 'bg-slate-50 text-slate-400 border-slate-200' },
};

// ─── Opponent display: list (≤4) or compact flag grid (>4) ───────────────────

function OpponentPill({ team }) {
  const name = team?.name || '?';
  const hasId = !!team?.id;
  return (
    <div className="flex items-center gap-1.5">
      {team?.flag && hasId ? (
        <img src={team.flag} alt="" className="h-3.5 w-[18px] shrink-0 rounded-[1px] border border-slate-100 object-cover" loading="lazy" />
      ) : (
        <div className="h-3.5 w-[18px] shrink-0 rounded-[1px] bg-slate-100" />
      )}
      <span className={`truncate text-xs leading-none ${hasId ? 'text-slate-700' : 'italic text-slate-400'}`}>
        {name}
      </span>
    </div>
  );
}

function OpponentFlagGrid({ opponents }) {
  return (
    <div className="flex flex-wrap gap-1">
      {opponents.map((t, i) => (
        t?.flag && t?.id ? (
          <img
            key={t.id ?? i}
            src={t.flag}
            alt={t.name}
            title={t.name}
            className="h-[18px] w-6 rounded-[2px] border border-slate-200 object-cover"
            loading="lazy"
          />
        ) : (
          <div key={i} className="h-[18px] w-6 rounded-[2px] bg-slate-100" title={t?.name} />
        )
      ))}
    </div>
  );
}

function OpponentSection({ opponents }) {
  if (!opponents.length) return null;
  const useGrid = opponents.length > 4;
  return (
    <div className="px-3 py-2.5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Could face
      </p>
      {useGrid ? (
        <OpponentFlagGrid opponents={opponents} />
      ) : (
        <div className="flex flex-col gap-1">
          {opponents.map((t, i) => <OpponentPill key={t?.id ?? i} team={t} />)}
        </div>
      )}
    </div>
  );
}

// ─── Actual match row ─────────────────────────────────────────────────────────

function MatchRow({ team, isWinner, isSelected, isLive }) {
  const name = team?.name || team?.source?.label || 'TBD';
  const isTbd = !team?.id;

  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 ${isSelected && isWinner ? 'bg-emerald-50' : isSelected ? 'bg-blue-50/60' : ''}`}>
      {team?.flag && !isTbd ? (
        <img src={team.flag} alt="" className="h-4 w-5 shrink-0 rounded-[2px] border border-slate-100 object-cover" loading="lazy" />
      ) : (
        <div className="h-4 w-5 shrink-0 rounded-[2px] bg-slate-100" />
      )}
      <span className={`flex-1 truncate text-sm leading-none ${isTbd ? 'italic text-slate-400' : isWinner ? 'font-semibold text-slate-900' : 'text-slate-700'} ${isSelected ? 'font-semibold' : ''}`}>
        {name}
      </span>
      {team?.score != null && (
        <span className={`shrink-0 text-sm font-bold tabular-nums ${isWinner ? 'text-slate-900' : 'text-slate-400'}`}>
          {team.score}
          {team.penaltyScore != null && <span className="text-xs font-normal text-slate-400"> ({team.penaltyScore})</span>}
        </span>
      )}
      {isLive && team?.score == null && (
        <span className="shrink-0 animate-pulse text-xs font-bold text-emerald-500">LIVE</span>
      )}
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function PathStepCard({ step, teamId, selectedTeam }) {
  const { roundLabel, match, status, potentialOpponents, showActual } = step;
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.tbd;
  const dimmed = status === 'eliminated';
  const isLive = match?.status === 'LIVE';
  const isHomeTeam = match?.home?.id === teamId;
  const dateStr = useMemo(() => fmtDate(match?.date), [match?.date]);

  return (
    <div className={`flex w-full shrink-0 flex-col gap-1.5 lg:w-[210px] ${dimmed ? 'opacity-40' : ''}`}>
      {/* Round label + status badge */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {roundLabel}
        </span>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
          {cfg.label}
        </span>
      </div>

      {/* Date — sits directly under the label, above the card */}
      {dateStr && (
        <p className="text-[11px] leading-none text-slate-400">{dateStr}</p>
      )}

      {/* Match card body */}
      <div className={`overflow-hidden rounded-xl border bg-white shadow-sm ${isLive ? 'border-emerald-300' : status === 'won' ? 'border-emerald-200' : 'border-slate-200'}`}>
        {showActual && match ? (
          <>
            <MatchRow team={match.home} isWinner={match.winnerSide === 'home'} isSelected={isHomeTeam} isLive={isLive} />
            <div className="border-t border-slate-100" />
            <MatchRow team={match.away} isWinner={match.winnerSide === 'away'} isSelected={!isHomeTeam} isLive={isLive} />
          </>
        ) : (
          <>
            {/* Selected team row */}
            <div className="flex items-center gap-2 bg-blue-50/60 px-3 py-2.5">
              {selectedTeam?.flag ? (
                <img src={selectedTeam.flag} alt="" className="h-4 w-5 shrink-0 rounded-[2px] border border-slate-100 object-cover" loading="lazy" />
              ) : (
                <div className="h-4 w-5 shrink-0 rounded-[2px] bg-slate-100" />
              )}
              <span className="flex-1 truncate text-sm font-semibold leading-none text-slate-900">
                {selectedTeam?.name ?? 'TBD'}
              </span>
            </div>

            <div className="border-t border-slate-100" />

            {potentialOpponents.length > 0 ? (
              <OpponentSection opponents={potentialOpponents} />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="h-4 w-5 shrink-0 rounded-[2px] bg-slate-100" />
                <span className="text-sm italic text-slate-400">TBD</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RoadToFinalPage() {
  const { data, loading, error } = useKnockout();
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const teams = useMemo(() => extractR32Teams(data?.rounds), [data]);

  const path = useMemo(
    () => buildPath(data?.rounds, selectedTeamId),
    [data, selectedTeamId],
  );

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) ?? null,
    [teams, selectedTeamId],
  );

  const eliminatedStep = path?.find((s) => s.status === 'lost');

  // Quick preview: R32 opponent + date for the selector panel
  const r32Step = path?.[0];
  const r32Opponent = r32Step?.match
    ? (r32Step.match.home?.id === selectedTeamId ? r32Step.match.away : r32Step.match.home)
    : null;
  const r32Date = fmtDate(r32Step?.match?.date);

  if (loading) return <LoadingPanel label="Loading bracket" />;
  if (error) return <EmptyState title="Could not load bracket" detail={error} />;
  if (!data?.rounds?.length) {
    return <EmptyState title="No bracket data" detail="Check back once the knockout stage begins." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Road to the Final</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a team to see who they could face on the way to the Final.
        </p>
      </div>

      {/* Team selector */}
      <div className="panel p-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {/* Selector */}
          <div>
            <label htmlFor="team-select" className="mb-2 block text-sm font-medium text-slate-700">
              Select a team
            </label>
            <div className="flex items-center gap-3">
              {selectedTeam?.flag && (
                <img src={selectedTeam.flag} alt="" className="h-6 w-8 shrink-0 rounded-[2px] border border-slate-200 object-cover" />
              )}
              <select
                id="team-select"
                value={selectedTeamId ?? ''}
                onChange={(e) => setSelectedTeamId(e.target.value || null)}
                className="field w-48"
              >
                <option value="">Choose a team…</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick preview — R32 fixture */}
          {r32Opponent && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Round of 32</p>
                {r32Date && <p className="mt-0.5 text-[11px] text-slate-500">{r32Date}</p>}
              </div>
              <div className="hidden h-8 w-px bg-slate-200 sm:block" />
              <div className="flex items-center gap-2">
                {selectedTeam?.flag && (
                  <img src={selectedTeam.flag} alt="" className="h-4 w-5 rounded-[2px] border border-slate-100 object-cover" />
                )}
                <span className="text-sm font-semibold text-slate-800">{selectedTeam?.name}</span>
              </div>
              <span className="text-xs font-medium text-slate-400">vs</span>
              <div className="flex items-center gap-2">
                {r32Opponent?.flag && r32Opponent?.id && (
                  <img src={r32Opponent.flag} alt="" className="h-4 w-5 rounded-[2px] border border-slate-100 object-cover" />
                )}
                <span className="text-sm font-medium text-slate-700">{r32Opponent?.name ?? 'TBD'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Path */}
      {path ? (
        <div className="panel p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-2.5">
            {selectedTeam?.flag && (
              <img src={selectedTeam.flag} alt="" className="h-6 w-8 rounded-[2px] border border-slate-200 object-cover" />
            )}
            <h2 className="text-lg font-bold text-slate-900">{selectedTeam?.name}</h2>
            <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
          </div>

          <div className="lg:overflow-x-auto">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:pb-2 lg:pr-6 lg:[min-width:max-content]">
              {path.map((step, idx) => (
                <Fragment key={step.roundLabel}>
                  <PathStepCard step={step} teamId={selectedTeamId} selectedTeam={selectedTeam} />
                  {idx < path.length - 1 && (
                    <>
                      <div className={`flex justify-center py-1 lg:hidden ${step.status === 'lost' || step.status === 'eliminated' ? 'opacity-25' : ''}`}>
                        <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden="true" />
                      </div>
                      <div className={`hidden shrink-0 px-2 lg:block ${step.status === 'lost' || step.status === 'eliminated' ? 'opacity-25' : ''}`}>
                        <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
                      </div>
                    </>
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          {eliminatedStep && (
            <p className="mt-4 text-sm font-medium text-rose-600">
              {selectedTeam?.name} were eliminated in the {eliminatedStep.roundLabel}.
            </p>
          )}
        </div>
      ) : selectedTeamId ? (
        <EmptyState title="Team not found in bracket" detail="This team may not have reached the knockout stage." />
      ) : null}
    </div>
  );
}
