import { useMemo, useRef, useState } from 'react';
import { Award, BarChart2, Copy, Crown, FileDown, Medal, Printer, RefreshCw, Star, Target, TrendingDown, TrendingUp, Trophy, Users, Zap } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { Flag } from '@/features/matches/components/Flag';
import { displayStatus, hasMatchScore, scoreText } from '@/features/matches/utils/matchStatus';
import { matchTitle, teamName } from '@/features/matches/utils/matchFormatters';
import { predictionText, resultText } from '@/features/predictions/utils/predictionDisplay';
import { dayKeyOf, formatDate, formatDayHeading } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';

// ─── Data logic ────────────────────────────────────────────────────────────────

function groupFixturesByMatchday(fixtures) {
  const groups = new Map();
  for (const match of fixtures) {
    const key = dayKeyOf(match.date);
    if (!groups.has(key)) {
      const date = match.date ? new Date(match.date) : null;
      groups.set(key, {
        key,
        date: date && !Number.isNaN(date.valueOf()) ? date : null,
        matches: [],
      });
    }
    groups.get(key).matches.push(match);
  }
  return [...groups.values()]
    .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
    .map((g) => ({ ...g, matches: g.matches.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0)) }));
}

function isActiveReportDay(group) {
  return group.matches.some((m) => displayStatus(m) === 'LIVE' || displayStatus(m) === 'FINISHED' || hasMatchScore(m));
}

function entryFor(row, matchId) {
  return row.match_points?.find((e) => String(e.match_id) === String(matchId)) || null;
}

function entryTotal(entry) {
  return roundPoints(entry?.match_total || 0);
}

function buildRows(leaderboard, matchdays, selectedIndex) {
  const rows = leaderboard.map((player) => {
    const dayTotals = matchdays.map((day) =>
      day.matches.reduce((sum, match) => sum + entryTotal(entryFor(player, match.id)), 0)
    );

    const cumulativeTotals = [];
    let running = 0;
    for (const total of dayTotals) {
      running = roundPoints(running + total);
      cumulativeTotals.push(running);
    }

    const selectedDay = matchdays[selectedIndex];
    const selectedEntries = selectedDay
      ? selectedDay.matches.map((match) => ({ match, entry: entryFor(player, match.id) }))
      : [];

    const breakdown = selectedEntries.reduce(
      (acc, { entry }) => {
        const e = entry || {};
        acc.ht += e.ht_pts || 0;
        acc.ft += e.ft_pts || 0;
        acc.closest += e.closest_pts || 0;
        acc.outcome += e.outcome_pts || 0;
        acc.exacts += (e.ht_pts || 0) > 0 || (e.ft_pts || 0) > 0 ? 1 : 0;
        return acc;
      },
      { ht: 0, ft: 0, closest: 0, outcome: 0, exacts: 0 }
    );

    const allEntries = player.match_points || [];
    const scoredMatches = allEntries.filter((e) => e.scored);
    const pointsEarned = scoredMatches.filter((e) => roundPoints(e.match_total || 0) > 0).length;
    const accuracy = scoredMatches.length ? Math.round((pointsEarned / scoredMatches.length) * 100) : 0;
    const exactFT = allEntries.filter((e) => (e.ft_pts || 0) > 0).length;
    const exactHT = allEntries.filter((e) => (e.ht_pts || 0) > 0).length;

    return {
      ...player,
      dayTotals,
      cumulativeTotals,
      selectedDayTotal: roundPoints(dayTotals[selectedIndex] || 0),
      selectedRunningTotal: roundPoints(cumulativeTotals[selectedIndex] || 0),
      selectedEntries,
      breakdown: {
        ht: roundPoints(breakdown.ht),
        ft: roundPoints(breakdown.ft),
        closest: roundPoints(breakdown.closest),
        outcome: roundPoints(breakdown.outcome),
        exacts: breakdown.exacts,
      },
      accuracy,
      exactFT,
      exactHT,
    };
  });

  const withRank = rankRows(rows, selectedIndex, 'selectedRank');
  const withPrev = rankRows(withRank, selectedIndex - 1, 'previousRank');
  return withPrev
    .map((row) => ({
      ...row,
      rankChange: row.previousRank && row.selectedRank ? row.previousRank - row.selectedRank : 0,
    }))
    .sort((a, b) => a.selectedRank - b.selectedRank || a.username.localeCompare(b.username));
}

function rankRows(rows, dayIndex, field) {
  if (dayIndex < 0) return rows.map((row) => ({ ...row, [field]: null }));
  const ranked = [...rows]
    .sort((a, b) => (b.cumulativeTotals[dayIndex] || 0) - (a.cumulativeTotals[dayIndex] || 0) || a.username.localeCompare(b.username))
    .map((row, i) => ({ id: row.id, username: row.username, rank: i + 1 }));
  const rankMap = new Map(ranked.map((r) => [String(r.id ?? r.username), r.rank]));
  return rows.map((row) => ({ ...row, [field]: rankMap.get(String(row.id ?? row.username)) || null }));
}

function buildShareText(matchday, rows) {
  return [
    `World Cup 2026 Matchday Report - ${formatDayHeading(matchday?.date)}`,
    '',
    ...rows.slice(0, 5).map((r) => `#${r.selectedRank} ${r.username}: +${roundPoints(r.selectedDayTotal)} today, ${roundPoints(r.total)} total`),
  ].join('\n');
}

// ─── SVG Charts ───────────────────────────────────────────────────────────────

function TournamentProgressChart({ rows, matchdays, highlightUsername }) {
  // Only plot matchdays that have actually been scored
  const scored = matchdays.map((day, i) => ({ day, i })).filter(({ day }) => isActiveReportDay(day));
  if (!scored.length || !rows.length) return null;

  const lastIdx = scored[scored.length - 1].i;
  const maxY = Math.max(...rows.map((r) => r.cumulativeTotals[lastIdx] || 0), 10);
  const W = 600, H = 180;
  const P = { t: 16, r: 64, b: 28, l: 40 };
  const iW = W - P.l - P.r, iH = H - P.t - P.b;
  const n = scored.length;

  const xAt = (j) => P.l + (n <= 1 ? iW / 2 : (j / (n - 1)) * iW);
  const yAt = (v) => P.t + iH - Math.min(1, (v || 0) / maxY) * iH;

  // Show at most ~10 x-axis labels to avoid crowding
  const labelStep = Math.max(1, Math.ceil(n / 10));
  const showLabel = (j) => j % labelStep === 0 || j === n - 1;

  const pathD = (row) =>
    scored.map(({ i }, j) => `${j === 0 ? 'M' : 'L'}${xAt(j).toFixed(1)},${yAt(row.cumulativeTotals[i] || 0).toFixed(1)}`).join(' ');

  const hl = rows.find((r) => r.username === highlightUsername);
  const others = rows.filter((r) => r.username !== highlightUsername);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="tpcAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = P.t + iH * (1 - t);
        return (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={P.l - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#94a3b8">{Math.round(maxY * t)}</text>
          </g>
        );
      })}
      {scored.map(({ i: mdIdx }, j) => showLabel(j) && (
        <text key={j} x={xAt(j)} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">
          MD{mdIdx + 1}
        </text>
      ))}
      {others.map((row) => (
        <path key={row.username} d={pathD(row)} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      ))}
      {hl && (() => {
        const path = pathD(hl);
        const pts = scored.map(({ i }, j) => [xAt(j), yAt(hl.cumulativeTotals[i] || 0)]);
        const [lastX, lastY] = pts[pts.length - 1];
        const area = `${path} L${lastX.toFixed(1)},${(P.t + iH).toFixed(1)} L${xAt(0).toFixed(1)},${(P.t + iH).toFixed(1)} Z`;
        return (
          <g>
            <path d={area} fill="url(#tpcAreaGrad)" />
            <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(([x, y], j) => (
              <circle key={j} cx={x.toFixed(1)} cy={y.toFixed(1)} r="4" fill="#2563eb" stroke="white" strokeWidth="1.5" />
            ))}
            <text x={(lastX + 7).toFixed(1)} y={lastY.toFixed(1)} textAnchor="start" dominantBaseline="middle" fontSize="10" fontWeight="800" fill="#2563eb">
              {roundPoints(hl.cumulativeTotals[lastIdx] || 0)}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

function MatchdayBarChart({ row, matchdays }) {
  // Only show matchdays that have been scored
  const scored = matchdays.map((day, i) => ({ day, i })).filter(({ day }) => isActiveReportDay(day));
  if (!scored.length) return <p className="py-4 text-center text-xs text-slate-400">No scored matchdays yet</p>;

  const values = scored.map(({ i }) => row.dayTotals[i] || 0);
  const max = Math.max(...values, 1);
  const W = 360, H = 100;
  const n = scored.length;
  const gap = 6;
  const barW = Math.max(10, Math.min(40, (W - gap * (n + 1)) / n));
  const totalW = n * barW + (n - 1) * gap;
  const startX = (W - totalW) / 2;

  // Show at most ~10 x-axis labels
  const labelStep = Math.max(1, Math.ceil(n / 10));
  const showLabel = (j) => j % labelStep === 0 || j === n - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="mbcBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {scored.map(({ i: mdIdx }, j) => {
        const v = values[j];
        const barH = Math.max(3, (v / max) * H);
        const x = startX + j * (barW + gap);
        const y = H - barH;
        return (
          <g key={j}>
            <rect x={x.toFixed(1)} y={y.toFixed(1)} width={barW} height={barH.toFixed(1)} rx="4"
              fill={v > 0 ? 'url(#mbcBarGrad)' : '#e2e8f0'} />
            {v > 0 && (
              <text x={(x + barW / 2).toFixed(1)} y={(y - 5).toFixed(1)} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d4ed8">
                +{roundPoints(v)}
              </text>
            )}
            {showLabel(j) && (
              <text x={(x + barW / 2).toFixed(1)} y={(H + 16).toFixed(1)} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">
                MD{mdIdx + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function RadarChart({ row, allRows }) {
  const cats = [
    { label: 'HT', key: 'ht_pts' },
    { label: 'FT', key: 'ft_pts' },
    { label: 'Closest', key: 'closest_pts' },
    { label: 'Outcome', key: 'outcome_pts' },
    { label: 'Winner', key: 'winner_pts' },
  ];
  const maxVals = cats.map((c) => Math.max(...allRows.map((r) => r[c.key] || 0), 1));
  const cx = 90, cy = 90, r = 65;
  const n = cats.length;
  const ang = (i) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i, scale) => [cx + r * scale * Math.cos(ang(i)), cy + r * scale * Math.sin(ang(i))];
  const polyD = (scale) => cats.map((_, i) => { const [x, y] = pt(i, scale); return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ') + 'Z';
  const normVals = cats.map((c, i) => Math.min(1, (row[c.key] || 0) / maxVals[i]));
  const valPts = normVals.map((v, i) => pt(i, v));
  const valD = valPts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + 'Z';

  return (
    <svg viewBox="0 0 180 180" className="w-full max-w-[180px] mx-auto" aria-hidden="true">
      {[0.25, 0.5, 0.75, 1].map((lv) => (
        <path key={lv} d={polyD(lv)} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {cats.map((_, i) => {
        const [x2, y2] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      <path d={valD} fill="#2563eb18" stroke="#2563eb" strokeWidth="2" />
      {valPts.map(([x, y], i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="4" fill="#2563eb" stroke="white" strokeWidth="1.5" />
      ))}
      {cats.map((c, i) => {
        const [x, y] = pt(i, 1.28);
        return (
          <text key={i} x={x.toFixed(1)} y={y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#475569">
            {c.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function RankDelta({ value }) {
  if (!value) return <span className="text-xs font-semibold text-slate-400">—</span>;
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-black ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      {up ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
      {Math.abs(value)}
    </span>
  );
}

function RankBadge({ rank }) {
  const s = rank === 1
    ? 'bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950 shadow-[0_4px_12px_rgba(250,204,21,0.45)]'
    : rank === 2
    ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700'
    : rank === 3
    ? 'bg-gradient-to-br from-orange-200 to-amber-400 text-blue-950'
    : 'bg-blue-100 text-blue-900';
  return (
    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-black ${s}`}>#{rank}</div>
  );
}

function RankingsPodium({ rows, onSelect }) {
  const top = rows.slice(0, 3);
  if (!top.length) return null;

  const ordered = [top[1], top[0], top[2]].filter(Boolean);
  const placeStyle = (rank) => {
    if (rank === 1) {
      return {
        height: 'h-32 sm:h-40',
        step: 'from-amber-300 to-yellow-500 text-blue-950 border-amber-300',
        medal: 'border-amber-200 bg-amber-50 text-amber-700',
        label: 'Leader',
      };
    }
    if (rank === 2) {
      return {
        height: 'h-24 sm:h-32',
        step: 'from-slate-200 to-slate-300 text-slate-800 border-slate-300',
        medal: 'border-slate-200 bg-slate-50 text-slate-700',
        label: 'Second',
      };
    }
    return {
      height: 'h-20 sm:h-28',
      step: 'from-orange-300 to-amber-500 text-blue-950 border-orange-300',
      medal: 'border-orange-200 bg-orange-50 text-orange-700',
      label: 'Third',
    };
  };

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/50 to-amber-50/60 px-4 pb-4 pt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Rankings Podium</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Top three by cumulative points</p>
        </div>
        <Trophy className="h-6 w-6 text-amber-500" aria-hidden="true" />
      </div>
      <div className="grid items-end gap-3" style={{ gridTemplateColumns: `repeat(${ordered.length}, minmax(0, 1fr))` }}>
        {ordered.map((row) => {
          const rank = row.selectedRank || row.rank;
          const style = placeStyle(rank);
          return (
            <button
              key={row.id || row.username}
              type="button"
              onClick={() => onSelect(row.username)}
              className="group flex min-w-0 flex-col items-center text-center"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black shadow-sm ${style.medal}`}>
                #{rank}
              </div>
              <p className="mt-2 w-full truncate text-sm font-black text-slate-950">{row.username}</p>
              <p className="mb-3 text-xs font-bold text-slate-500">{roundPoints(row.total)} pts</p>
              <div className={`flex w-full flex-col items-center justify-center rounded-t-2xl border bg-gradient-to-br px-2 transition group-hover:translate-y-[-2px] ${style.height} ${style.step}`}>
                <span className="text-4xl font-black leading-none">{rank}</span>
                <span className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]">{style.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="h-2 rounded-full bg-gradient-to-r from-slate-300 via-emerald-700 to-orange-400" />
    </div>
  );
}

function MatchResultCard({ match }) {
  const status = displayStatus(match);
  const live = status === 'LIVE';
  return (
    <div className="flex min-w-[200px] flex-1 items-center gap-3 rounded-xl border border-blue-100 bg-white/85 px-3 py-2.5 shadow-sm backdrop-blur">
      <div className="shrink-0 overflow-hidden rounded ring-1 ring-blue-100"><Flag team={match.home} /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800">{teamName(match.home)}</p>
        <p className="truncate text-xs font-semibold text-slate-800">{teamName(match.away)}</p>
      </div>
      <div className="text-right">
        <p className="text-xl font-black tabular-nums text-blue-950">{scoreText(match) || 'vs'}</p>
        <p className={`text-[10px] font-bold uppercase tracking-wide ${live ? 'text-rose-600' : 'text-blue-600'}`}>{status || 'Pending'}</p>
      </div>
      <div className="shrink-0 overflow-hidden rounded ring-1 ring-blue-100"><Flag team={match.away} /></div>
    </div>
  );
}

function SnapshotCard({ icon: Icon, color, label, value, detail }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="panel p-4">
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${colors[color] || colors.blue}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 truncate text-2xl font-black text-slate-950">{value}</p>
      {detail && <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{detail}</p>}
    </div>
  );
}

function CategoryBar({ label, value, maxValue, barClass }) {
  const width = maxValue > 0 ? `${Math.min(100, Math.max(0, (value / maxValue) * 100))}%` : '0%';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className="text-xs font-black text-slate-950">{roundPoints(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <Icon className="mb-2 h-5 w-5 text-slate-400" aria-hidden="true" />
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-2xl font-black text-slate-950">{value}</p>
      {sub && <p className="mt-0.5 text-xs font-medium text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Player Spotlight ─────────────────────────────────────────────────────────

function PlayerSpotlight({ row, matchdays, allRows, fixturesById }) {
  const maxHT = Math.max(...allRows.map((r) => r.ht_pts || 0), 1);
  const maxFT = Math.max(...allRows.map((r) => r.ft_pts || 0), 1);
  const maxClosest = Math.max(...allRows.map((r) => r.closest_pts || 0), 1);
  const maxOutcome = Math.max(...allRows.map((r) => r.outcome_pts || 0), 1);
  const maxWinner = Math.max(...allRows.map((r) => r.winner_pts || 0), 1);

  const rankGrad =
    row.selectedRank === 1 ? 'from-amber-300 to-yellow-500 text-blue-950'
    : row.selectedRank === 2 ? 'from-slate-200 to-slate-400 text-slate-800'
    : row.selectedRank === 3 ? 'from-orange-300 to-amber-500 text-blue-950'
    : 'from-blue-100 to-blue-200 text-blue-950';

  const sortedMatches = [...(row.match_points || [])].sort((a, b) => {
    const mA = fixturesById?.get(String(a.match_id));
    const mB = fixturesById?.get(String(b.match_id));
    return new Date(mA?.date || 0).getTime() - new Date(mB?.date || 0).getTime()
      || String(a.match_id).localeCompare(String(b.match_id));
  });

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.08)]">
      {/* ── Card header ── */}
      <header className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-br from-white via-blue-50 to-amber-50 px-5 py-7 sm:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12]">
          <div className="absolute left-8 right-8 top-8 h-px bg-blue-500" />
          <div className="absolute bottom-8 left-8 right-8 h-px bg-blue-500" />
          <div className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-px bg-blue-500" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-emerald-500" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${rankGrad} text-xl font-black ring-2 ring-white shadow-lg`}>
              #{row.selectedRank}
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Player Analysis</span>
                <RankDelta value={row.rankChange} />
              </div>
              <h3 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{row.username}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {row.match_points?.length || 0} predictions · Winner pick:{' '}
                <span className="font-bold text-blue-700">{row.winner || 'Not set'}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3 sm:flex-col sm:items-end">
            <div className="rounded-2xl border border-blue-100 bg-white px-5 py-3 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Total Points</p>
              <p className="text-4xl font-black text-slate-950">{roundPoints(row.total)}</p>
            </div>
            {row.winner_pts > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Winner Bonus</p>
                <p className="text-2xl font-black text-amber-700">+{roundPoints(row.winner_pts)}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="p-5 sm:p-7 space-y-8">
        {/* ── Key metrics ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricBox icon={Crown} label="Rank" value={`#${row.selectedRank}`} />
          <MetricBox icon={Target} label="Scoring Rate" value={`${row.accuracy}%`} sub={`of ${row.match_points?.filter((e) => e.scored).length || 0} played`} />
          <MetricBox icon={Zap} label="FT Exact" value={row.exactFT} sub="full-time scores" />
          <MetricBox icon={Star} label="Matchday" value={`+${row.selectedDayTotal}`} sub="pts this day" />
        </div>

        {/* ── Scoring breakdown + charts ── */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left col: bars + radar */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <BarChart2 className="h-4 w-4" aria-hidden="true" />
              Scoring Breakdown
            </h4>
            <div className="space-y-3">
              <CategoryBar label="Half-Time Exact" value={row.ht_pts || 0} maxValue={maxHT} barClass="bg-amber-400" />
              <CategoryBar label="Full-Time Exact" value={row.ft_pts || 0} maxValue={maxFT} barClass="bg-blue-500" />
              <CategoryBar label="Closest Score" value={row.closest_pts || 0} maxValue={maxClosest} barClass="bg-violet-500" />
              <CategoryBar label="Outcome (Win/Draw)" value={row.outcome_pts || 0} maxValue={maxOutcome} barClass="bg-emerald-500" />
              <CategoryBar label="W.Cup Winner Bonus" value={row.winner_pts || 0} maxValue={maxWinner} barClass="bg-rose-400" />
            </div>
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Performance Radar</p>
              <RadarChart row={row} allRows={allRows} />
              <p className="mt-2 text-center text-[10px] text-slate-400">Normalised vs top scorer in each category</p>
            </div>
          </div>

          {/* Right col: progress + matchday bars */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              Tournament Progress
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              {matchdays.length > 1
                ? <TournamentProgressChart rows={allRows} matchdays={matchdays} highlightUsername={row.username} />
                : <p className="py-4 text-center text-xs text-slate-400">More matchdays needed for progress chart</p>
              }
              <p className="mt-2 text-center text-[10px] text-slate-400">Blue line = this player · Grey = everyone else</p>
            </div>

            <h4 className="mb-4 mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <BarChart2 className="h-4 w-4" aria-hidden="true" />
              Points Per Matchday
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <MatchdayBarChart row={row} matchdays={matchdays} />
            </div>

            {/* Totals summary row */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { label: 'Best MD', value: `+${roundPoints(Math.max(...(row.dayTotals.length ? row.dayTotals : [0])))}` },
                { label: 'Avg per MD', value: roundPoints(row.dayTotals.length ? row.dayTotals.reduce((a, b) => a + b, 0) / row.dayTotals.length : 0) },
                { label: 'HT Exact', value: row.exactHT },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-0.5 text-xl font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Match history ── */}
        <div>
          <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <Award className="h-4 w-4" aria-hidden="true" />
            Match History ({sortedMatches.length} predictions)
          </h4>
          {sortedMatches.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No match predictions recorded yet.</p>
          )}
          <div className="space-y-2">
            {sortedMatches.map((entry) => {
              const match = fixturesById?.get(String(entry.match_id));
              const pts = roundPoints(entry.match_total || 0);
              const has = pts > 0;
              const pred = entry.prediction;
              const res = entry.result;
              const htPred = pred?.ht_home != null ? `${pred.ht_home}–${pred.ht_away}` : '–';
              const ftPred = pred?.ft_home != null ? `${pred.ft_home}–${pred.ft_away}` : '–';
              const htRes = res?.ht_home != null ? `${res.ht_home}–${res.ht_away}` : '–';
              const ftRes = res?.ft_home != null ? `${res.ft_home}–${res.ft_away}` : null;
              const catPills = [
                { label: 'HT', pts: entry.ht_pts, color: 'bg-amber-50 text-amber-700 border border-amber-100' },
                { label: 'FT', pts: entry.ft_pts, color: 'bg-blue-50 text-blue-700 border border-blue-100' },
                { label: 'Closest', pts: entry.closest_pts, color: 'bg-violet-50 text-violet-700 border border-violet-100' },
                { label: 'Outcome', pts: entry.outcome_pts, color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
              ].filter(({ pts: p }) => roundPoints(p || 0) > 0);
              return (
                <div key={entry.match_id} className={`overflow-hidden rounded-xl border transition ${has ? 'border-blue-200' : 'border-slate-200'}`}>
                  {/* ── Match header ── */}
                  <div className={`flex flex-wrap items-center gap-3 px-4 py-3 ${has ? 'bg-blue-50/70' : 'bg-slate-50/60'}`}>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {match ? (
                        <>
                          <div className="shrink-0 overflow-hidden rounded ring-1 ring-slate-200"><Flag team={match.home} /></div>
                          <span className="truncate text-sm font-bold text-slate-900">{teamName(match.home)}</span>
                          <span className="shrink-0 text-xs font-semibold text-slate-400">vs</span>
                          <span className="truncate text-sm font-bold text-slate-900">{teamName(match.away)}</span>
                          <div className="shrink-0 overflow-hidden rounded ring-1 ring-slate-200"><Flag team={match.away} /></div>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-slate-500">Match #{entry.match_id}</span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {match?.date && <span className="text-[10px] text-slate-400">{formatDate(match.date)}</span>}
                      {match && <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 ring-1 ring-slate-200">{displayStatus(match)}</span>}
                      <span className={`rounded-lg px-3 py-1.5 text-sm font-black tabular-nums ${has ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                        {has ? `+${pts}` : entry.scored ? '0' : '–'}
                      </span>
                    </div>
                  </div>

                  {/* ── Score comparison ── */}
                  <div className="flex items-stretch gap-2 border-t border-slate-100 bg-white px-4 py-3">
                    {/* Your pick */}
                    <div className="flex-1 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                      <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Your Pick</p>
                      <div className="flex items-end gap-3">
                        <div>
                          <p className="text-[9px] text-slate-400">HT</p>
                          <p className="text-lg font-black tabular-nums leading-none text-slate-700">{htPred}</p>
                        </div>
                        <div className="mb-0.5 h-5 w-px bg-slate-200" />
                        <div>
                          <p className="text-[9px] text-slate-400">FT</p>
                          <p className="text-lg font-black tabular-nums leading-none text-slate-700">{ftPred}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-slate-300">
                      <span className="text-base font-light">→</span>
                    </div>

                    {/* Result */}
                    <div className={`flex-1 rounded-lg border p-2.5 ${has ? 'border-blue-100 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
                      <p className={`mb-2 text-[9px] font-bold uppercase tracking-wider ${has ? 'text-blue-500' : 'text-slate-400'}`}>Result</p>
                      {ftRes != null ? (
                        <div className="flex items-end gap-3">
                          <div>
                            <p className="text-[9px] text-slate-400">HT</p>
                            <p className={`text-lg font-black tabular-nums leading-none ${has ? 'text-blue-700' : 'text-slate-700'}`}>{htRes}</p>
                          </div>
                          <div className="mb-0.5 h-5 w-px bg-slate-200" />
                          <div>
                            <p className="text-[9px] text-slate-400">FT</p>
                            <p className={`text-lg font-black tabular-nums leading-none ${has ? 'text-blue-700' : 'text-slate-700'}`}>{ftRes}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="py-1 text-xs text-slate-400">{entry.scored ? resultText(entry, match) : 'Pending'}</p>
                      )}
                    </div>

                    {/* Category pills stacked on right (only when points earned) */}
                    {catPills.length > 0 && (
                      <div className="flex flex-col justify-center gap-1">
                        {catPills.map(({ label, pts: p, color }) => (
                          <span key={label} className={`rounded px-2 py-0.5 text-[10px] font-black whitespace-nowrap ${color}`}>
                            {label} +{roundPoints(p)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Standings row ────────────────────────────────────────────────────────────

function StandingsRow({ row, matchdays, isCurrentUser, isSelected, onSelect }) {
  const categoryPills = [
    { label: 'HT', value: row.ht_pts, cls: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: 'FT', value: row.ft_pts, cls: 'border-blue-200 bg-blue-50 text-blue-700' },
    { label: 'Closest', value: row.closest_pts, cls: 'border-violet-200 bg-violet-50 text-violet-700' },
    { label: 'Outcome', value: row.outcome_pts, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'Winner', value: row.winner_pts, cls: 'border-rose-200 bg-rose-50 text-rose-700' },
  ];

  return (
    <button
      type="button"
      onClick={() => onSelect(row.username)}
      className={`group w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
        isSelected
          ? 'border-emerald-300 bg-gradient-to-br from-white via-emerald-50/70 to-amber-50/70 ring-2 ring-emerald-100'
          : isCurrentUser
          ? 'border-amber-200 bg-gradient-to-br from-white via-amber-50/50 to-white hover:border-amber-300 hover:shadow-sm'
          : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm'
      }`}
    >
      <div className="grid items-center gap-4 px-4 py-4 md:grid-cols-[68px_1fr_96px_110px_96px_84px]">
        <div className="flex items-center gap-2.5 md:flex-col md:items-center md:gap-1.5">
          <RankBadge rank={row.selectedRank} />
          <RankDelta value={row.rankChange} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-black text-slate-950">{row.username}</p>
            {isCurrentUser && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">You</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {matchdays.map((day, i) => {
              const pts = roundPoints(row.dayTotals[i] || 0);
              return (
                <span key={day.key}
                  title={`${formatDate(day.date)}: +${pts}`}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${pts > 0 ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  MD{i + 1} +{pts}
                </span>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categoryPills.map(({ label, value, cls }) => (
              <span key={label} className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${cls}`}>
                {label} {roundPoints(value || 0)}
              </span>
            ))}
          </div>
        </div>
        <ScoreCol label="Today" value={`+${row.selectedDayTotal}`} highlight />
        <ScoreCol label="After MD" value={row.selectedRunningTotal} />
        <ScoreCol label="Total" value={roundPoints(row.total)} />
        <ScoreCol label="Exacts" value={row.breakdown.exacts} />
      </div>
      {isSelected && (
        <div className="border-t border-emerald-100 bg-emerald-50/70 px-4 py-1.5 text-[11px] font-bold text-emerald-700">
          ↓ Full analysis below
        </div>
      )}
    </button>
  );
}

function ScoreCol({ label, value, highlight }) {
  return (
    <div className="text-left md:text-right">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-lg font-black ${highlight ? 'text-emerald-700' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MatchdayReportPage({ leaderboard, fixtures, currentUser, loading, refreshAll }) {
  const matchdays = useMemo(() => groupFixturesByMatchday(fixtures), [fixtures]);
  const defaultKey = useMemo(() => {
    const active = [...matchdays].reverse().find(isActiveReportDay);
    return active?.key || matchdays[0]?.key || '';
  }, [matchdays]);

  const [selectedKey, setSelectedKey] = useState('');
  const [copyState, setCopyState] = useState('Copy summary');
  const [selectedUsername, setSelectedUsername] = useState(null);
  const spotlightRef = useRef(null);

  const fixturesById = useMemo(() => new Map(fixtures.map((m) => [String(m.id), m])), [fixtures]);
  const activeKey = selectedKey || defaultKey;
  const selectedIndex = Math.max(0, matchdays.findIndex((d) => d.key === activeKey));
  const selectedMatchday = matchdays[selectedIndex];
  const rows = useMemo(() => buildRows(leaderboard, matchdays, selectedIndex), [leaderboard, matchdays, selectedIndex]);
  const topScorer = rows[0];
  const leader = [...leaderboard].sort((a, b) => b.total - a.total)[0];
  const totalMatchdayPoints = roundPoints(rows.reduce((sum, r) => sum + r.selectedDayTotal, 0));
  const spotlightRow = rows.find((r) => r.username === selectedUsername) || null;
  const allScoredMatchdays = useMemo(() => matchdays.filter(isActiveReportDay), [matchdays]);

  const [pdfState, setPdfState] = useState('idle'); // idle | generating | done

  async function downloadPDF() {
    setPdfState('generating');
    try {
      const [{ pdf }, { MatchdayReportPDF }, { createElement }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/MatchdayReportPDF'),
        import('react'),
      ]);
      const doc = createElement(MatchdayReportPDF, { rows, matchdays, fixturesById });
      const blob = await pdf(doc).toBlob();
      // Open in new tab so the browser's native PDF viewer renders it immediately —
      // no file saved to disk; use the viewer's own download button if needed.
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setPdfState('done');
      window.setTimeout(() => setPdfState('idle'), 2500);
    } catch (err) {
      console.error('PDF generation failed', err);
      setPdfState('idle');
    }
  }

  function handleSelectPlayer(username) {
    setSelectedUsername((prev) => (prev === username ? null : username));
    window.setTimeout(() => spotlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(buildShareText(selectedMatchday, rows));
      setCopyState('Copied!');
    } catch {
      setCopyState('Failed');
    }
    window.setTimeout(() => setCopyState('Copy summary'), 1500);
  }

  if (loading) return <LoadingPanel label="Loading matchday report" />;
  if (!leaderboard.length || !matchdays.length) {
    return <EmptyState title="No report data yet" detail="Reports will appear after fixtures and player predictions are available." />;
  }

  return (
    <div className="report-sheet space-y-6">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-amber-50 px-5 py-7 sm:px-8">
        {/* Pitch line decoration */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12]">
          <div className="absolute left-10 right-10 top-12 h-px bg-blue-500" />
          <div className="absolute bottom-12 left-10 right-10 h-px bg-blue-500" />
          <div className="absolute left-1/2 top-12 h-[calc(100%-6rem)] w-px bg-blue-500" />
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500" />
        </div>
        {/* Tournament colour band */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-10 top-0 h-full w-28 rotate-12 bg-amber-200/35" />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 via-amber-400 to-emerald-500" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950">
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="leading-tight">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">FIFA World Cup 2026</p>
                  <p className="text-xs font-black text-slate-950">CAN · MEX · USA</p>
                </div>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Matchday Report
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{formatDayHeading(selectedMatchday?.date)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Matchday points, rank movement, cumulative totals, and detailed player analysis.{' '}
              <span className="font-semibold text-blue-700">Click any player to view their full breakdown.</span>
            </p>
          </div>

          <div className="print-hidden flex flex-wrap gap-2 lg:flex-col lg:items-stretch lg:min-w-[220px]">
            <select className="field bg-white text-slate-900" value={activeKey} onChange={(e) => setSelectedKey(e.target.value)}>
              {matchdays.map((day, i) => (
                <option key={day.key} value={day.key}>Matchday {i + 1} — {formatDate(day.date)}</option>
              ))}
            </select>
            <button
              className="btn w-full justify-center gap-2 border border-amber-200 bg-amber-50 font-semibold text-amber-700 transition hover:bg-amber-100"
              onClick={downloadPDF}
              disabled={pdfState === 'generating'}
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              {pdfState === 'generating' ? 'Generating…' : pdfState === 'done' ? 'Opened!' : 'Preview Programme PDF'}
            </button>
            <div className="flex gap-2">
              <button className="btn btn-secondary flex-1" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden="true" />Print
              </button>
              <button className="btn btn-secondary flex-1" onClick={refreshAll}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh
              </button>
              <button className="btn btn-secondary flex-1" onClick={copySummary}>
                <Copy className="h-4 w-4" aria-hidden="true" />{copyState}
              </button>
            </div>
          </div>
        </div>

        {selectedMatchday?.matches.length > 0 && (
          <div className="relative mt-6 flex flex-wrap gap-3">
            {selectedMatchday.matches.map((match) => (
              <MatchResultCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* ── Snapshot stats ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SnapshotCard icon={Trophy} color="amber" label="Top matchday scorer" value={topScorer ? `+${roundPoints(topScorer.selectedDayTotal)}` : '—'} detail={topScorer?.username} />
        <SnapshotCard icon={Crown} color="blue" label="Overall leader" value={leader?.username || '—'} detail={leader ? `${roundPoints(leader.total)} pts total` : undefined} />
        <SnapshotCard icon={Users} color="indigo" label="Players tracked" value={rows.length} detail={`${selectedMatchday?.matches.length || 0} fixtures this day`} />
        <SnapshotCard icon={Zap} color="violet" label="Points awarded" value={totalMatchdayPoints} detail="Total across all players" />
      </section>

      {/* ── Tournament progress chart ── */}
      {matchdays.length > 1 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
                <TrendingUp className="h-5 w-5 text-blue-600" aria-hidden="true" />
                Tournament Progress
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Cumulative points over all matchdays ·{' '}
                {spotlightRow ? <span className="font-semibold text-blue-600">Highlighting {spotlightRow.username}</span> : 'select a player below to highlight'}
              </p>
            </div>
          </div>
          <TournamentProgressChart rows={rows} matchdays={matchdays} highlightUsername={spotlightRow?.username} />
        </section>
      )}

      {/* ── Standings ── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
              <Medal className="h-5 w-5 text-amber-500" aria-hidden="true" />
              Overall Standings
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">Ranked by cumulative points after this matchday · Click a player for detailed analysis</p>
          </div>
        </div>
        <RankingsPodium rows={rows} onSelect={handleSelectPlayer} />
        <div className="space-y-2">
          {rows.map((row) => (
            <StandingsRow
              key={row.id || row.username}
              row={row}
              matchdays={matchdays}
              isCurrentUser={row.username === currentUser?.username}
              isSelected={row.username === selectedUsername}
              onSelect={handleSelectPlayer}
            />
          ))}
        </div>
      </section>

      {/* ── Player spotlight ── */}
      <section ref={spotlightRef}>
        {spotlightRow ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
                <Award className="h-5 w-5 text-amber-500" aria-hidden="true" />
                Player Analysis — {spotlightRow.username}
              </h3>
              <button type="button" onClick={() => setSelectedUsername(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50">
                Dismiss
              </button>
            </div>
            <PlayerSpotlight row={spotlightRow} matchdays={matchdays} allRows={rows} fixturesById={fixturesById} />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <Award className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-slate-500">Select a player above to view their full analysis</p>
            <p className="mt-1 text-xs text-slate-400">Charts, radar, scoring breakdown, and match-by-match history</p>
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="print-hidden flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-sm font-black text-slate-950">Prediction League Matchday Report</p>
          <p className="text-xs text-slate-500">Built for quick sharing, PDF export, and matchday review.</p>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">FIFA</p>
            <p className="text-xs font-black text-slate-950">World Cup 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
