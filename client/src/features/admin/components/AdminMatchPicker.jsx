import { useMemo, useState } from 'react';
import { Activity, Check, Pencil, Search, X } from 'lucide-react';
import { dayKeyOf, formatDayHeading, formatTime } from '@/lib/date/index';
import { canShowMatchDetails, displayStatus, formatMatchMinute, hasMatchScore, isHalfTime, scoreText } from '@/features/matches/utils/matchStatus';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { MatchDayNav } from '@/features/predictions/components/MatchDayNav';

function MiniFlag({ team }) {
  if (!team?.flagUrl) {
    return (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-slate-100 bg-slate-50 text-[9px] font-bold text-slate-400">
        {team?.abbreviation || '--'}
      </span>
    );
  }
  return <img src={team.flagUrl} alt="" loading="lazy" className="h-6 w-6 shrink-0 rounded border border-slate-100 object-cover" />;
}

function StatusBadge({ status }) {
  if (status === 'LIVE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
        </span>
        Live
      </span>
    );
  }
  const tone = status === 'FINISHED' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>{status}</span>
  );
}

function TeamLine({ team, score }) {
  return (
    <div className="flex items-center gap-2">
      <MiniFlag team={team} />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{teamName(team)}</span>
      {score != null && <span className="text-sm font-black tabular-nums text-slate-900">{score}</span>}
    </div>
  );
}

function MatchCard({ match, selected, onSelect }) {
  const showScore = hasMatchScore(match);
  return (
    <button
      type="button"
      onClick={() => onSelect(match.id)}
      className={`group relative flex flex-col gap-2 rounded-xl border p-3 text-left transition ${
        selected
          ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-200'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500">{formatTime(match.date)}</span>
        <StatusBadge status={displayStatus(match)} />
      </div>
      <TeamLine team={match.home} score={showScore ? match.score?.home : null} />
      <TeamLine team={match.away} score={showScore ? match.score?.away : null} />
      {(match.group || match.stage) && (
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {match.group || match.stage}
        </p>
      )}
      {selected && (
        <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-white shadow-sm ring-2 ring-white">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}

function buildDayGroups(fixtures) {
  const map = new Map();
  for (const m of fixtures) {
    const key = dayKeyOf(m.date);
    if (!map.has(key)) {
      map.set(key, { key, date: m.date ? new Date(m.date) : null, matches: [], hasLive: false });
    }
    const group = map.get(key);
    group.matches.push(m);
    if (displayStatus(m) === 'LIVE') group.hasLive = true;
  }
  const groups = [...map.values()].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
  groups.forEach((g) => g.matches.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0)));
  return groups;
}

export function AdminMatchPicker({ fixtures, selectedMatch, selectedMatchId, onSelect, onViewStats }) {
  const [browsing, setBrowsing] = useState(!selectedMatchId);
  const [query, setQuery] = useState('');
  const [userDay, setUserDay] = useState(null);

  const dayGroups = useMemo(() => buildDayGroups(fixtures), [fixtures]);

  const defaultDay = useMemo(() => {
    if (!dayGroups.length) return null;
    const live = dayGroups.find((g) => g.hasLive);
    if (live) return live.key;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const upcoming = dayGroups.find((g) => g.date && g.date >= start);
    return (upcoming || dayGroups[0]).key;
  }, [dayGroups]);

  const activeDay = userDay ?? (selectedMatch ? dayKeyOf(selectedMatch.date) : defaultDay);
  const isAll = activeDay === 'ALL';
  const activeGroup = isAll ? null : dayGroups.find((g) => g.key === activeDay) || dayGroups[0];

  const q = query.trim().toLowerCase();
  const results = q
    ? fixtures.filter((m) => `${teamName(m.home)} ${teamName(m.away)}`.toLowerCase().includes(q))
    : isAll
      ? [...fixtures].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      : activeGroup?.matches || [];

  function handleSelect(id) {
    onSelect(String(id));
    setBrowsing(false);
    setQuery('');
  }

  function startBrowsing() {
    setBrowsing(true);
    setUserDay(selectedMatch ? dayKeyOf(selectedMatch.date) : null);
  }

  // Collapsed view — a match is selected and we're not browsing.
  if (selectedMatch && !browsing) {
    return (
      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
            <TeamBlock team={selectedMatch.home} align="left" />
            <div className="flex flex-col items-center">
              <StatusBadge status={displayStatus(selectedMatch)} />
              {hasMatchScore(selectedMatch) && (
                <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-950">{scoreText(selectedMatch)}</p>
              )}
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                {displayStatus(selectedMatch) === 'LIVE'
                  ? isHalfTime(selectedMatch)
                    ? 'HT'
                    : (formatMatchMinute(selectedMatch.minute) ?? formatTime(selectedMatch.date))
                  : formatTime(selectedMatch.date)}
              </p>
            </div>
            <TeamBlock team={selectedMatch.away} align="right" />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canShowMatchDetails(selectedMatch) && (
              <button className="btn btn-secondary" onClick={() => onViewStats(selectedMatch)}>
                <Activity className="h-4 w-4" aria-hidden="true" />
                Details
              </button>
            )}
            <button className="btn btn-primary" onClick={startBrowsing}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Change match
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Browsing view — day strip + searchable match cards.
  return (
    <div className="panel space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-950">Select a match</h3>
          <p className="text-sm text-slate-500">Browse by day or search for a team.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            className="field pl-9 pr-9"
            type="search"
            placeholder="Search teams…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {!q && (
        <MatchDayNav
          days={dayGroups}
          activeDay={activeDay}
          onSelect={setUserDay}
          totalCount={fixtures.length}
        />
      )}

      <div>
        <p className="mb-3 text-sm font-bold text-slate-700">
          {q
            ? `${results.length} ${results.length === 1 ? 'result' : 'results'} for "${query.trim()}"`
            : isAll
              ? `All matches (${results.length})`
              : activeGroup?.date
                ? formatDayHeading(activeGroup.date)
                : 'All matches'}
        </p>

        {results.length ? (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                selected={String(match.id) === String(selectedMatchId)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
            No matches found.
          </p>
        )}
      </div>
    </div>
  );
}

function TeamBlock({ team, align }) {
  return (
    <div className={`flex items-center gap-2.5 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <MiniFlag team={team} />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{teamName(team)}</p>
        {team?.abbreviation && <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{team.abbreviation}</p>}
      </div>
    </div>
  );
}
