import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, BarChart3, LayoutGrid, Users, X } from 'lucide-react';
import { Flag } from './Flag';
import { FormationPitch } from './FormationPitch';
import { TeamStatsPanel } from './TeamStatsPanel';
import { MatchTimeline } from './MatchTimeline';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { formatDate, formatTime } from '@/lib/date/index';
import { scoreStatusLabel, scoreText, displayStatus } from '../utils/matchStatus';
import { teamName } from '../utils/matchFormatters';

// Map each player id involved in a substitution to its direction, minute and counterpart.
function buildSubMap(events = []) {
  const map = new Map();
  for (const e of events) {
    const isSub = e.typeCode === 5 || e.typeCode === 65 || /substitut/i.test(e.type || '');
    if (!isSub) continue;
    const desc = e.description || '';
    const onName = (/^(.*?)\s*\(in\)/.exec(desc) || [])[1]?.trim() || null;
    const offName = (/replace\s+(.*?)\s*\(out\)/i.exec(desc) || [])[1]?.trim() || null;
    const minute = e.minute || null;
    if (e.playerId) map.set(e.playerId, { dir: 'on', minute, withName: offName });
    if (e.subPlayerId) map.set(e.subPlayerId, { dir: 'off', minute, withName: onName });
  }
  return map;
}

function minuteLabel(minute) {
  if (!minute) return null;
  const text = String(minute).trim().replace(/'+$/, '');
  return text ? `${text}'` : null;
}

export function MatchStatsDialog({ match, stats, loading, error, onClose }) {
  const homeName = stats?.home?.name || teamName(match.home);
  const awayName = stats?.away?.name || teamName(match.away);
  const score = stats?.score?.home != null && stats?.score?.away != null
    ? `${stats.score.home} - ${stats.score.away}`
    : scoreText(match);
  const status = stats?.status || displayStatus(match);
  const isLive = status === 'LIVE';
  const isHalfTime = stats?.isHalfTime || match?.isHalfTime || stats?.phase === 'HALF_TIME' || match?.phase === 'HALF_TIME';
  const liveMinute = minuteLabel(stats?.minute || match.minute);
  const statusLabel = isLive
    ? isHalfTime
      ? 'Half time'
      : (liveMinute ? `Live ${liveMinute}` : 'Live')
    : status === 'FINISHED'
      ? 'FT'
      : scoreStatusLabel(match);
  const subMap = buildSubMap(stats?.events || []);
  const isUpcoming = status !== 'LIVE' && status !== 'FINISHED';
  const [tab, setTab] = useState(isUpcoming ? 'lineups' : 'summary');

  const tabs = [
    { id: 'summary', label: 'Summary', icon: LayoutGrid },
    ...(stats?.teamStats ? [{ id: 'stats', label: 'Stats', icon: BarChart3 }] : []),
    { id: 'lineups', label: 'Lineups', icon: Users },
  ];
  const activeTab = tabs.some((t) => t.id === tab) ? tab : (isUpcoming ? 'lineups' : 'summary');

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1100] flex flex-col bg-slate-950/80 backdrop-blur-sm sm:flex-row sm:items-start sm:justify-center sm:px-3 sm:py-8"
      onClick={onClose}
    >
      <div
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white sm:max-h-[calc(100vh-4rem)] sm:max-w-5xl sm:flex-none sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 px-4 py-4 sm:px-7 sm:py-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
          </div>

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">{isUpcoming ? 'Team Lineups' : 'Match details'}</p>
              <p className="mt-1 text-xs font-medium text-blue-200/80">
                {formatDate(match.date)} · {formatTime(match.date)}
              </p>
            </div>
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
              onClick={onClose}
              aria-label="Close match details"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:mt-4 sm:gap-6">
            <HeroTeam team={match.home} name={homeName} formation={stats?.home?.tactics} align="left" />

            <div className="flex flex-col items-center">
              <span className={`mb-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isLive ? 'bg-blue-400/20 text-blue-200' : 'bg-white/10 text-blue-100/80'
              }`}>
                {statusLabel}
              </span>
              <div className="rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 px-3 py-2 text-center shadow-[0_10px_30px_-8px_rgba(250,204,21,0.7)] sm:px-5 sm:py-2.5">
                <p className="text-2xl font-black tabular-nums text-blue-950 sm:text-4xl">{score || '–'}</p>
              </div>
              {liveMinute && <p className="mt-1 text-xs font-bold text-amber-200">{liveMinute}</p>}
            </div>

            <HeroTeam team={match.away} name={awayName} formation={stats?.away?.tactics} align="right" />
          </div>
        </div>

        {/* Tab bar */}
        {stats && !loading && !error && (
          <div className="flex shrink-0 gap-1 border-b border-slate-200 bg-white px-3 sm:px-5">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = id === activeTab;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-bold transition ${
                    isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                  {isActive && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
          {loading ? (
            <LoadingPanel label="Loading match details" />
          ) : error ? (
            <EmptyState title="Could not load match details" detail={error} />
          ) : !stats && isUpcoming ? (
            <EmptyState
              title="Lineups not released yet"
              detail="Team lineups are typically published around 1 hour before kickoff. Check back closer to the match."
            />
          ) : stats ? (
            <div className="space-y-5">
              {activeTab === 'summary' && (
                <>
                  <FormationPitch
                    home={stats.home}
                    away={stats.away}
                    homeFallback={match.home}
                    awayFallback={match.away}
                    events={stats.events || []}
                  />
                  <StatsOverview stats={stats} match={match} homeName={homeName} awayName={awayName} />
                  <MatchTimeline events={stats.events || []} homeName={homeName} awayName={awayName} />
                </>
              )}

              {activeTab === 'stats' && stats.teamStats && (
                <TeamStatsPanel teamStats={stats.teamStats} homeName={homeName} awayName={awayName} />
              )}

              {activeTab === 'lineups' && (
                <section className="grid gap-4 sm:grid-cols-2">
                  <LineupPanel label="Home lineup" team={stats.home} fallbackName={homeName} accent="home" subMap={subMap} />
                  <LineupPanel label="Away lineup" team={stats.away} fallbackName={awayName} accent="away" subMap={subMap} />
                </section>
              )}
            </div>
          ) : (
            <EmptyState title="No match details" detail="No detailed data is available for this match yet." />
          )}
        </div>
      </div>
    </div>
  );
}

function HeroTeam({ team, name, formation, align }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 sm:gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <div className="shrink-0 overflow-hidden rounded-lg ring-2 ring-white/20">
        <Flag team={team} />
      </div>
      <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
        {/* Mobile: abbreviation primary, full name secondary */}
        <h2 className="text-sm font-bold text-white sm:hidden">
          {team?.abbreviation || name}
        </h2>
        <p className="truncate text-[10px] font-semibold leading-tight text-blue-200/70 sm:hidden">
          {name}
        </p>
        {/* sm+: full name primary, formation secondary */}
        <h2 className="hidden truncate text-base font-bold text-white sm:block sm:text-lg">{name}</h2>
        {formation && <p className="hidden text-xs font-semibold text-blue-200/80 sm:block">{formation}</p>}
      </div>
    </div>
  );
}

function derivePossession(stats) {
  if (stats.possession) return stats.possession;
  const h = stats.teamStats?.home?.Possession;
  const a = stats.teamStats?.away?.Possession;
  if (typeof h !== 'number' && typeof a !== 'number') return null;
  const home = Math.round((h || 0) * 100);
  const away = Math.round((a || 0) * 100);
  return { home, away };
}

function StatsOverview({ stats, match, homeName, awayName }) {
  const possession = derivePossession(stats);
  const statusValue = stats.isHalfTime || stats.phase === 'HALF_TIME'
    ? 'Half time'
    : displayStatus(match) || stats.status || 'Unknown';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-600" aria-hidden="true" />
        <h3 className="text-base font-bold text-slate-950">Match stats</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatBox label="Status" value={statusValue} />
        <StatBox label="Period" value={stats.period ?? '-'} />
        <StatBox label="Attendance" value={stats.attendance ? stats.attendance.toLocaleString() : '-'} />
      </div>

      {possession ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
            <span className="truncate">{homeName}</span>
            <span className="text-xs uppercase tracking-wide text-slate-400">Possession</span>
            <span className="truncate text-right">{awayName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10 text-sm font-bold text-blue-700">{possession.home}%</span>
            <div className="relative flex h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-blue-500" style={{ width: `${possession.home}%` }} />
              <div className="ml-auto h-full bg-amber-400" style={{ width: `${possession.away}%` }} />
            </div>
            <span className="w-10 text-right text-sm font-bold text-amber-600">{possession.away}%</span>
          </div>
          {possession.home + possession.away < 100 && (
            <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
              {100 - possession.home - possession.away}% in contest
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          Team statistics are not available from the feed yet.
        </p>
      )}
    </section>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-slate-950 sm:text-lg">{value}</p>
    </div>
  );
}

function LineupPanel({ label, team, fallbackName, accent, subMap }) {
  const dot = accent === 'away' ? 'bg-slate-900 ring-amber-300' : 'bg-white ring-blue-400';
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h3 className="text-base font-bold text-slate-950">{label}</h3>
        </div>
        {team?.tactics && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{team.tactics}</span>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2.5">
        <span className={`h-3 w-3 shrink-0 rounded-full ring-2 ${dot}`} />
        <div>
          <p className="text-sm font-bold text-slate-950">{team?.name || fallbackName}</p>
          <p className="text-xs text-slate-500">Coach: {team?.headCoach || 'TBC'}</p>
        </div>
      </div>

      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Starters</h4>
      <GroupedStarterList players={team?.starters || []} subMap={subMap} />
      <div className="mt-6">
        <PlayerList title="Substitutes" players={team?.substitutes || []} subMap={subMap} compact showPosition />
      </div>
    </section>
  );
}

function SubBadge({ info }) {
  if (!info) return null;
  const isOn = info.dir === 'on';
  const Icon = isOn ? ArrowUp : ArrowDown;
  const title = isOn
    ? `Came on${info.withName ? ` for ${info.withName}` : ''}${info.minute ? ` (${info.minute})` : ''}`
    : `Replaced${info.withName ? ` by ${info.withName}` : ''}${info.minute ? ` (${info.minute})` : ''}`;
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        isOn ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {info.minute || (isOn ? 'On' : 'Off')}
    </span>
  );
}

const POSITION_TINT = {
  GK: 'bg-amber-100 text-amber-700',
  DF: 'bg-sky-100 text-sky-700',
  MF: 'bg-blue-100 text-blue-700',
  FW: 'bg-rose-100 text-rose-700',
};

const POSITION_GROUPS = [
  { key: 'GK', label: 'Goalkeepers',  header: 'border border-amber-200 bg-amber-50 text-amber-700' },
  { key: 'DF', label: 'Defenders',    header: 'border border-sky-200 bg-sky-50 text-sky-700' },
  { key: 'MF', label: 'Midfielders',  header: 'border border-blue-200 bg-blue-50 text-blue-700' },
  { key: 'FW', label: 'Forwards',     header: 'border border-rose-200 bg-rose-50 text-rose-700' },
];

function PlayerRow({ player, subMap, compact, showPosition }) {
  return (
    <div
      key={`${player.id}-${player.shirtNumber}-${player.name}`}
      className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2 transition hover:border-slate-200 hover:bg-white"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
        {player.shirtNumber || '-'}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <p className={`truncate font-semibold text-slate-900 ${compact ? 'text-sm' : 'text-[15px]'}`}>
          {player.name || 'Unnamed player'}
          {player.captain && <span className="ml-2 text-[10px] font-black text-amber-500">C</span>}
        </p>
        <SubBadge info={subMap?.get(player.id)} />
      </div>
      {showPosition && (
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${POSITION_TINT[player.position] || 'bg-slate-100 text-slate-500'}`}>
          {player.position || '-'}
        </span>
      )}
    </div>
  );
}

function GroupedStarterList({ players, subMap }) {
  if (!players.length) {
    return <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">Not available.</p>;
  }

  const grouped = Object.fromEntries(POSITION_GROUPS.map((g) => [g.key, []]));
  for (const p of players) {
    const key = grouped[p.position] !== undefined ? p.position : 'MF';
    grouped[key].push(p);
  }

  return (
    <div className="space-y-4">
      {POSITION_GROUPS.map(({ key, label, header }) => {
        const group = grouped[key];
        if (!group.length) return null;
        return (
          <div key={key}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${header}`}>
                {label}
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid gap-1.5">
              {group.map((player) => (
                <PlayerRow key={`${player.id}-${player.shirtNumber}`} player={player} subMap={subMap} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlayerList({ title, players, compact, subMap }) {
  return (
    <div>
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</h4>
      {players.length ? (
        <div className="grid gap-1.5">
          {players.map((player) => (
            <PlayerRow
              key={`${player.id}-${player.shirtNumber}-${player.name}`}
              player={player}
              subMap={subMap}
              compact={compact}
              showPosition
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">Not available.</p>
      )}
    </div>
  );
}
