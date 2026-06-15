import { memo, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Award, BarChart2, Check, CheckCircle2, ChevronDown, Clock, Copy, Crown, Eye, FileDown, Lock, Loader2, Medal, Printer, RefreshCw, Star, Target, TrendingDown, TrendingUp, Trophy, Users, X, XCircle, Zap } from 'lucide-react';
import { apiRequest } from '@/api';
import { useAuth } from '@/app/providers/AuthContext';
import { useAppData } from '@/app/providers/AppDataContext';
import {
  Area, AreaChart,
  Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { Podium } from '@/components/ui/Podium';
import { Flag } from '@/features/matches/components/Flag';
import { displayStatus, hasMatchScore, scoreText } from '@/features/matches/utils/matchStatus';
import { matchTitle, outcomeLabel, teamName } from '@/features/matches/utils/matchFormatters';
import { predictionText } from '@/features/predictions/utils/predictionDisplay';
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

// ─── Charts (Recharts) ────────────────────────────────────────────────────────

const CHART_PALETTE = [
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#db2777', // pink-600
  '#0891b2', // cyan-600
  '#ea580c', // orange-600
  '#4f46e5', // indigo-600
  '#0f766e', // teal-700
  '#9333ea', // purple-600
];

function TournamentProgressChart({ rows, matchdays, highlightUsername }) {
  const scored = matchdays.map((day, i) => ({ day, i })).filter(({ day }) => isActiveReportDay(day));
  if (!scored.length || !rows.length) return null;

  const data = scored.map(({ i }) => {
    const point = { name: `MD${i + 1}` };
    rows.forEach((r) => { point[r.username] = roundPoints(r.cumulativeTotals[i] || 0); });
    return point;
  });

  const sorted = [...rows].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const colorOf = (username) => {
    const idx = sorted.findIndex((r) => r.username === username);
    return CHART_PALETTE[idx % CHART_PALETTE.length];
  };
  const slugOf = (username) => username.replace(/[^a-z0-9]/gi, '_');

  const hasHighlight = Boolean(highlightUsername && rows.find((r) => r.username === highlightUsername));
  const hl = rows.find((r) => r.username === highlightUsername);
  const others = rows.filter((r) => r.username !== highlightUsername);
  const renderOrder = [...others, ...(hl ? [hl] : [])];

  const lastData = data[data.length - 1] || {};
  const legendRows = sorted.map((r) => ({
    username: r.username,
    color: colorOf(r.username),
    pts: lastData[r.username] ?? 0,
    rank: r.rank,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const items = [...payload]
      .filter((p) => p.value != null)
      .sort((a, b) => b.value - a.value)
      .map((p, i) => ({ ...p, rank: i + 1 }));
    return (
      <div className="min-w-[180px] rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-2xl backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        </div>
        <div className="space-y-1.5">
          {items.map((p) => {
            const color = colorOf(p.dataKey);
            const isHl = p.dataKey === highlightUsername;
            return (
              <div key={p.dataKey} className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white" style={{ backgroundColor: color }}>
                  {p.rank}
                </span>
                <span className={`flex-1 truncate ${isHl ? 'font-black' : 'font-semibold'} text-xs text-slate-700`}>
                  {p.dataKey}
                </span>
                <span className="text-xs font-black tabular-nums" style={{ color }}>{p.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
          <defs>
            {renderOrder.map((r) => {
              const color = colorOf(r.username);
              const slug = slugOf(r.username);
              const isHlPlayer = hasHighlight && r.username === highlightUsername;
              const opacity = hasHighlight && !isHlPlayer ? 0 : 0.18;
              return (
                <linearGradient key={slug} id={`grad-${slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={opacity} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700, letterSpacing: 1 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          {others.map((r) => {
            const color = colorOf(r.username);
            const slug = slugOf(r.username);
            return (
              <Area
                key={r.username}
                type="monotone"
                dataKey={r.username}
                stroke={color}
                strokeWidth={hasHighlight ? 1 : 2}
                strokeOpacity={hasHighlight ? 0.2 : 0.85}
                fill={`url(#grad-${slug})`}
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            );
          })}
          {hl && (() => {
            const color = colorOf(hl.username);
            const slug = slugOf(hl.username);
            return (
              <Area
                key={hl.username}
                type="monotone"
                dataKey={hl.username}
                stroke={color}
                strokeWidth={3}
                strokeOpacity={1}
                fill={`url(#grad-${slug})`}
                fillOpacity={1}
                dot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 3 }}
                isAnimationActive={false}
              />
            );
          })()}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
        {legendRows.map((r) => {
          const dimmed = hasHighlight && r.username !== highlightUsername;
          return (
            <div
              key={r.username}
              className="flex items-center gap-1.5 transition-opacity"
              style={{ opacity: dimmed ? 0.35 : 1 }}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="text-[11px] font-semibold text-slate-600">{r.username}</span>
              <span className="text-[11px] font-black tabular-nums" style={{ color: r.color }}>{r.pts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchdayBarChart({ row, matchdays }) {
  const scored = matchdays.map((day, i) => ({ day, i })).filter(({ day }) => isActiveReportDay(day));
  if (!scored.length) return <p className="py-4 text-center text-xs text-slate-400">No scored matchdays yet</p>;

  const data = scored.map(({ i }) => ({
    name: `MD${i + 1}`,
    pts: roundPoints(row.dayTotals[i] || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 16, right: 4, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
        <Tooltip
          cursor={{ fill: '#f8fafc', radius: 6 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="text-sm font-black text-blue-600">+{payload[0].value} pts</p>
              </div>
            );
          }}
        />
        <Bar dataKey="pts" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pts > 0 ? '#2563eb' : '#e2e8f0'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
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
  const data = cats.map((c, i) => ({
    category: c.label,
    value: Math.round(Math.min(100, ((row[c.key] || 0) / maxVals[i]) * 100)),
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsRadarChart data={data} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{payload[0].payload.category}</p>
                <p className="text-sm font-black text-blue-600">{payload[0].value}% of best</p>
              </div>
            );
          }}
        />
        <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.12} strokeWidth={2}
          dot={{ r: 3, fill: '#2563eb', stroke: 'white', strokeWidth: 1.5 }}
          isAnimationActive={false}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
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


function MatchResultCard({ match, onClick }) {
  const status = displayStatus(match);
  const live = status === 'LIVE';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm text-left transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Home */}
        <div className="flex flex-col items-center gap-1.5">
          <Flag team={match.home} />
          <p className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-slate-900">
            {teamName(match.home)}
          </p>
        </div>

        {/* Score / Status */}
        <div className="shrink-0 px-3 text-center">
          {hasMatchScore(match) ? (
            <p className="whitespace-nowrap text-2xl font-black tabular-nums leading-none text-slate-950">
              {scoreText(match)}
            </p>
          ) : (
            <p className="whitespace-nowrap text-base font-black uppercase leading-none text-slate-400">VS</p>
          )}
          {live ? (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              LIVE
            </span>
          ) : (
            <p className={`mt-1.5 text-[10px] font-bold uppercase tracking-wide ${
              status === 'FINISHED' ? 'text-blue-600' : 'text-amber-600'
            }`}>
              {status || 'UPCOMING'}
            </p>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-1.5">
          <Flag team={match.away} />
          <p className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-slate-900">
            {teamName(match.away)}
          </p>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-blue-500 transition group-hover:text-blue-700">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View all predictions
      </div>
    </button>
  );
}

function timeBeforeKickoff(submittedAt, matchDate) {
  if (!submittedAt || !matchDate) return null;
  const diffMs = new Date(matchDate) - new Date(submittedAt);
  if (diffMs < 0) return 'after kickoff';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m before`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h before`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h before` : `${days}d before`;
}

function ScorePick({ pick, actual, earned, hasPoints }) {
  const correct = earned && hasPoints;
  const incorrect = !earned && hasPoints && pick != null;
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold tabular-nums ${correct ? 'text-emerald-700' : incorrect ? 'text-rose-500' : pick != null ? 'text-slate-600' : 'text-slate-300'}`}>
      {pick != null ? pick : '—'}
      {correct && <span className="text-emerald-500">✓</span>}
      {incorrect && actual != null && <span className="text-[10px] font-normal text-slate-400">({actual})</span>}
    </span>
  );
}

function PredictionsTable({ rows, currentUser, matchDate, actualResult }) {
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const totalA = (a.ht_pts || 0) + (a.ft_pts || 0) + (a.closest_pts || 0) + (a.outcome_pts || 0);
      const totalB = (b.ht_pts || 0) + (b.ft_pts || 0) + (b.closest_pts || 0) + (b.outcome_pts || 0);
      return totalB - totalA;
    });
  }, [rows]);

  const submissionStats = useMemo(() => {
    const times = rows
      .filter((r) => r.submitted_at)
      .map((r) => new Date(r.submitted_at).getTime())
      .filter(Number.isFinite);
    if (!times.length) return null;
    const earliest = new Date(Math.min(...times));
    const latest = new Date(Math.max(...times));
    const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
    return { earliest, latest, avg: new Date(avgMs) };
  }, [rows]);

  const hasScored = rows.some((r) => r.ht_pts != null || r.ft_pts != null);

  return (
    <div className="space-y-3">
      {/* Actual result banner */}
      {actualResult && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Match result</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {actualResult.ht_home != null && (
                <span className="text-sm font-black tabular-nums text-emerald-900">
                  HT {actualResult.ht_home} – {actualResult.ht_away}
                </span>
              )}
              <span className="text-xs text-emerald-400">·</span>
              <span className="text-sm font-black tabular-nums text-emerald-900">
                FT {actualResult.ft_home} – {actualResult.ft_away}
              </span>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                {outcomeLabel(actualResult.ft_home, actualResult.ft_away)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submission timing summary */}
      {submissionStats && (
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-3">
          {[
            { label: 'Earliest', value: timeBeforeKickoff(submissionStats.earliest, matchDate) },
            { label: 'Latest',   value: timeBeforeKickoff(submissionStats.latest, matchDate) },
            { label: 'Average',  value: timeBeforeKickoff(submissionStats.avg, matchDate) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-900">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Mobile cards (< sm) ── */}
      <div className="space-y-2 sm:hidden">
        {sorted.map((row, i) => {
          const total = roundPoints((row.ht_pts || 0) + (row.ft_pts || 0) + (row.closest_pts || 0) + (row.outcome_pts || 0));
          const isYou = String(row.user_id) === String(currentUser?.id);
          const username = row.username || (Array.isArray(row.users) ? row.users[0]?.username : row.users?.username) || '—';
          const submitted = timeBeforeKickoff(row.submitted_at, matchDate);
          const htEarned = (row.ht_pts || 0) > 0;
          const ftEarned = (row.ft_pts || 0) > 0;
          const outEarned = (row.outcome_pts || 0) > 0;
          const clsEarned = roundPoints(row.closest_pts || 0) > 0;
          const htActual = actualResult?.ht_home != null ? `${actualResult.ht_home}–${actualResult.ht_away}` : null;
          const ftActual = actualResult?.ft_home != null ? `${actualResult.ft_home}–${actualResult.ft_away}` : null;

          return (
            <div key={row.user_id} className={`overflow-hidden rounded-xl border ${isYou ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                  <span className="truncate font-bold text-slate-900">{username}</span>
                  {isYou && <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">You</span>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${total > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                  {total} pts
                </span>
              </div>

              {row.ft_home != null && (
                <div className="border-t border-slate-100 px-3.5 py-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`rounded-lg px-2.5 py-2 ${htEarned && hasScored ? 'bg-emerald-50 ring-1 ring-emerald-100' : !htEarned && hasScored && row.ht_home != null ? 'bg-rose-50 ring-1 ring-rose-100' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${htEarned && hasScored ? 'text-emerald-500' : !htEarned && hasScored && row.ht_home != null ? 'text-rose-400' : 'text-slate-400'}`}>Half time</p>
                      <p className={`mt-0.5 font-mono text-base font-black tabular-nums leading-none ${htEarned && hasScored ? 'text-emerald-700' : !htEarned && hasScored && row.ht_home != null ? 'text-rose-600' : row.ht_home != null ? 'text-slate-700' : 'text-slate-300'}`}>
                        {row.ht_home != null ? `${row.ht_home}–${row.ht_away}` : '—'}
                      </p>
                      {hasScored && !htEarned && row.ht_home != null && htActual && (
                        <p className="mt-0.5 text-[9px] text-slate-400">actual {htActual}</p>
                      )}
                      {hasScored && <p className={`mt-1 text-[10px] font-bold ${htEarned ? 'text-emerald-600' : 'text-slate-400'}`}>{htEarned ? `+${row.ht_pts} pts` : '0 pts'}</p>}
                    </div>
                    <div className={`rounded-lg px-2.5 py-2 ${ftEarned && hasScored ? 'bg-emerald-50 ring-1 ring-emerald-100' : !ftEarned && hasScored ? 'bg-rose-50 ring-1 ring-rose-100' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${ftEarned && hasScored ? 'text-emerald-500' : !ftEarned && hasScored ? 'text-rose-400' : 'text-slate-400'}`}>Full time</p>
                      <p className={`mt-0.5 font-mono text-base font-black tabular-nums leading-none ${ftEarned && hasScored ? 'text-emerald-700' : !ftEarned && hasScored ? 'text-rose-600' : 'text-slate-700'}`}>
                        {row.ft_home}–{row.ft_away}
                      </p>
                      {hasScored && !ftEarned && ftActual && (
                        <p className="mt-0.5 text-[9px] text-slate-400">actual {ftActual}</p>
                      )}
                      {hasScored && <p className={`mt-1 text-[10px] font-bold ${ftEarned ? 'text-emerald-600' : 'text-slate-400'}`}>{ftEarned ? `+${row.ft_pts} pts` : '0 pts'}</p>}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {hasScored && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${outEarned ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                        {outEarned ? '✓ ' : ''}{outcomeLabel(row.ft_home, row.ft_away)} {outEarned ? `+${row.outcome_pts}` : '0'}
                      </span>
                    )}
                    {!hasScored && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        {outcomeLabel(row.ft_home, row.ft_away)}
                      </span>
                    )}
                    {clsEarned && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                        ✓ Closest +{roundPoints(row.closest_pts)}
                      </span>
                    )}
                    {submitted && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {submitted}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Desktop table (sm+) ── */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Player</th>
                <th className="px-3 py-2.5 text-center">
                  HT pick
                  {actualResult?.ht_home != null && (
                    <span className="block text-[9px] font-normal normal-case tracking-normal text-slate-400">actual {actualResult.ht_home}–{actualResult.ht_away}</span>
                  )}
                </th>
                <th className="px-3 py-2.5 text-center">
                  FT pick
                  {actualResult?.ft_home != null && (
                    <span className="block text-[9px] font-normal normal-case tracking-normal text-slate-400">actual {actualResult.ft_home}–{actualResult.ft_away}</span>
                  )}
                </th>
                <th className="px-3 py-2.5 text-center">HT pts</th>
                <th className="px-3 py-2.5 text-center">FT pts</th>
                <th className="px-3 py-2.5 text-center">Cls</th>
                <th className="px-3 py-2.5 text-center">Out</th>
                <th className="px-3 py-2.5 text-center">Submitted</th>
                <th className="px-3 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((row, i) => {
                const total = roundPoints((row.ht_pts || 0) + (row.ft_pts || 0) + (row.closest_pts || 0) + (row.outcome_pts || 0));
                const isYou = String(row.user_id) === String(currentUser?.id);
                const username = row.username || (Array.isArray(row.users) ? row.users[0]?.username : row.users?.username) || '—';
                const ptsCell = (val) => <span className={val > 0 ? 'font-bold text-emerald-700' : 'text-slate-400'}>{val}</span>;
                const htEarned = (row.ht_pts || 0) > 0;
                const ftEarned = (row.ft_pts || 0) > 0;
                return (
                  <tr key={row.user_id} className={isYou ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                    <td className="w-8 px-3 py-2.5 text-xs font-bold text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{username}</span>
                        {isYou && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">You</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs">
                      <ScorePick
                        pick={row.ht_home != null ? `${row.ht_home}–${row.ht_away}` : null}
                        actual={actualResult?.ht_home != null ? `${actualResult.ht_home}–${actualResult.ht_away}` : null}
                        earned={htEarned}
                        hasPoints={hasScored}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs">
                      <ScorePick
                        pick={row.ft_home != null ? `${row.ft_home}–${row.ft_away}` : null}
                        actual={actualResult?.ft_home != null ? `${actualResult.ft_home}–${actualResult.ft_away}` : null}
                        earned={ftEarned}
                        hasPoints={hasScored}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(row.ht_pts || 0)}</td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(row.ft_pts || 0)}</td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(roundPoints(row.closest_pts || 0))}</td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(row.outcome_pts || 0)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-[11px] text-slate-500">
                      {timeBeforeKickoff(row.submitted_at, matchDate) ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-black tabular-nums text-slate-950">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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

const PlayerSpotlight = memo(function PlayerSpotlight({ row, matchdays, allRows, fixturesById }) {
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

  // Group matches by matchday
  const matchdayGroups = (() => {
    const grouped = new Map();
    sortedMatches.forEach((entry) => {
      const match = fixturesById?.get(String(entry.match_id));
      const key = match?.date ? dayKeyOf(match.date) : 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, { key, date: match?.date ? new Date(match.date) : null, entries: [], dayTotal: 0 });
      }
      const g = grouped.get(key);
      g.entries.push(entry);
      g.dayTotal += roundPoints(entry.match_total || 0);
    });
    return [...grouped.values()].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
  })();

  return (
    <div className="overflow-hidden">
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

        {/* ── Match history grouped by matchday ── */}
        <div>
          <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <Award className="h-4 w-4" aria-hidden="true" />
            Match History ({sortedMatches.length} predictions · {matchdayGroups.length} matchday{matchdayGroups.length !== 1 ? 's' : ''})
          </h4>
          {matchdayGroups.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No match predictions recorded yet.</p>
          )}
          <div className="space-y-2">
            {matchdayGroups.map(({ key, date, entries, dayTotal }) => {
              const mdIndex = matchdays.findIndex((d) => d.key === key);
              const mdLabel = mdIndex >= 0 ? `Matchday ${mdIndex + 1}` : 'Matchday';
              const hasPoints = dayTotal > 0;

              return (
                <details key={key} name={`spotlight-days-${row.username}`} className="group/day overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3 px-4 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-950">{mdLabel}</p>
                        <p className="text-xs text-slate-400">
                          {date ? formatDayHeading(date) : '—'} · {entries.length} match{entries.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span className={`rounded-lg px-3 py-1.5 text-sm font-black tabular-nums ${
                          hasPoints ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {hasPoints ? `+${dayTotal}` : '0'} pts
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-open/day:rotate-180" aria-hidden="true" />
                      </div>
                    </div>
                  </summary>

                  <div className="space-y-2 border-t border-slate-100 p-3">
                    {entries.map((entry) => {
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
                      const htCorrect = roundPoints(entry.ht_pts || 0) > 0;
                      const ftCorrect = roundPoints(entry.ft_pts || 0) > 0;
                      const status = match ? displayStatus(match) : (entry.scored ? 'FINISHED' : 'UPCOMING');
                      const live = status === 'LIVE';

                      return (
                        <details key={entry.match_id} className="group/match overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <summary className="cursor-pointer list-none px-4 pb-3 pt-4">
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                                  <Flag team={match?.home} />
                                </div>
                                <p className="line-clamp-2 text-center text-xs font-bold leading-tight text-slate-900">
                                  {teamName(match?.home) || `Match #${entry.match_id}`}
                                </p>
                              </div>

                              <div className="shrink-0 px-4 text-center">
                                {hasMatchScore(match) ? (
                                  <p className="whitespace-nowrap text-3xl font-black tabular-nums leading-none text-slate-950">
                                    {scoreText(match)}
                                  </p>
                                ) : (
                                  <p className="whitespace-nowrap text-xl font-black uppercase leading-none text-slate-400">VS</p>
                                )}
                                {live ? (
                                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                                    </span>
                                    Live
                                  </span>
                                ) : (
                                  <p className={`mt-2 text-[10px] font-bold uppercase tracking-wide ${
                                    status === 'FINISHED' ? 'text-blue-600' : 'text-amber-600'
                                  }`}>
                                    {status}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-center gap-2">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                                  <Flag team={match?.away} />
                                </div>
                                <p className="line-clamp-2 text-center text-xs font-bold leading-tight text-slate-900">
                                  {teamName(match?.away) || ''}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <div className="flex flex-wrap gap-1.5">
                                {catPills.map(({ label, pts: p, color }) => (
                                  <span key={label} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${color}`}>
                                    {label} +{roundPoints(p)}
                                  </span>
                                ))}
                              </div>
                              <div className="ml-auto flex items-center gap-2">
                                <span className={`rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
                                  has ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {has ? `+${pts}` : entry.scored ? '0' : '–'} pts
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-open/match:rotate-180" aria-hidden="true" />
                              </div>
                            </div>
                          </summary>

                          <div className="border-t border-slate-100">
                            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Pick</p>
                                  <div className="space-y-2">
                                    {[{ label: 'HT', val: htPred }, { label: 'FT', val: ftPred }].map(({ label, val }) => (
                                      <div key={label} className="flex items-center gap-2">
                                        <span className="w-5 shrink-0 text-[10px] font-black text-slate-400">{label}</span>
                                        <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-black tabular-nums text-slate-800 ring-1 ring-slate-200">{val}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Result</p>
                                  <div className="space-y-2">
                                    {[
                                      { label: 'HT', val: htRes, correct: htCorrect },
                                      { label: 'FT', val: ftRes || '—', correct: ftCorrect },
                                    ].map(({ label, val, correct }) => (
                                      <div key={label} className="flex items-center gap-2">
                                        <span className="w-5 shrink-0 text-[10px] font-black text-slate-400">{label}</span>
                                        <span className={`rounded-lg px-2.5 py-1 text-sm font-black tabular-nums ring-1 ${
                                          correct ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-white text-slate-400 ring-slate-200'
                                        }`}>{val}</span>
                                        {correct && <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-4">
                              {[
                                { label: 'Half Time', sub: '5 pts', pts: entry.ht_pts },
                                { label: 'Full Time', sub: '10 pts', pts: entry.ft_pts },
                                { label: 'Closest Score', sub: '6 pts shared', pts: entry.closest_pts },
                                { label: 'Win / Draw', sub: '4 pts', pts: entry.outcome_pts },
                              ].map(({ label, sub, pts: p }) => {
                                const earned = roundPoints(p || 0) > 0;
                                return (
                                  <div key={label} className={`rounded-xl p-3.5 ${earned ? 'bg-blue-600 shadow-[0_4px_20px_-6px_rgba(37,99,235,0.55)]' : 'border border-slate-100 bg-slate-50'}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-wide ${earned ? 'text-blue-200' : 'text-slate-400'}`}>{label}</p>
                                    <p className={`mt-1.5 text-2xl font-black tabular-nums leading-none ${earned ? 'text-white' : 'text-slate-300'}`}>+{roundPoints(p || 0)}</p>
                                    <p className={`mt-1 text-[10px] font-medium ${earned ? 'text-blue-300' : 'text-slate-300'}`}>{sub}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.row.username === next.row.username &&
  prev.row.total === next.row.total &&
  prev.row.selectedDayTotal === next.row.selectedDayTotal &&
  prev.row.selectedRank === next.row.selectedRank &&
  prev.allRows.length === next.allRows.length &&
  prev.matchdays.length === next.matchdays.length
);

// ─── Standings row ────────────────────────────────────────────────────────────

function StandingsRow({ row, isCurrentUser, isSelected, onSelect }) {
  const earnedPills = [
    { label: 'HT', value: row.ht_pts, cls: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: 'FT', value: row.ft_pts, cls: 'border-blue-200 bg-blue-50 text-blue-700' },
    { label: 'Closest', value: row.closest_pts, cls: 'border-violet-200 bg-violet-50 text-violet-700' },
    { label: 'Outcome', value: row.outcome_pts, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'Winner', value: row.winner_pts, cls: 'border-rose-200 bg-rose-50 text-rose-700' },
  ].filter(({ value }) => roundPoints(value || 0) > 0);

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
      <div className="flex items-center gap-3 px-4 py-4">
        {/* Rank + delta */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <RankBadge rank={row.selectedRank} />
          <RankDelta value={row.rankChange} />
        </div>

        {/* Name + earned category pills */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-black text-slate-950">{row.username}</p>
            {isCurrentUser && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">You</span>
            )}
          </div>
          {earnedPills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {earnedPills.map(({ label, value, cls }) => (
                <span key={label} className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${cls}`}>
                  {label} {roundPoints(value || 0)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Today + Total */}
        <div className="flex shrink-0 items-center gap-4">
          {row.selectedDayTotal > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Today</p>
              <p className="text-lg font-black text-emerald-600">+{row.selectedDayTotal}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</p>
            <p className="text-lg font-black text-slate-950">{roundPoints(row.total)}</p>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="border-t border-emerald-100 bg-emerald-50/70 px-4 py-1.5 text-[11px] font-bold text-emerald-700">
          Analysis open →
        </div>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MatchdayReportPage() {
  const { user: currentUser, token } = useAuth();
  const { leaderboard, fixtures, loading, error, refresh: refreshAll } = useAppData();
  const matchdays = useMemo(() => groupFixturesByMatchday(fixtures), [fixtures]);
  const defaultKey = useMemo(() => {
    const active = [...matchdays].reverse().find(isActiveReportDay);
    return active?.key || matchdays[0]?.key || '';
  }, [matchdays]);

  const [selectedKey, setSelectedKey] = useState('');
  const [copyState, setCopyState] = useState('Copy summary');
  const [selectedUsername, setSelectedUsername] = useState(null);

  // Match predictions sheet
  const [predMatch, setPredMatch] = useState(null);
  const [predRows, setPredRows] = useState([]);
  const [predActualResult, setPredActualResult] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState(null);

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

  useEffect(() => {
    document.body.style.overflow = (spotlightRow || predMatch) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [spotlightRow, predMatch]);

  function handleSelectPlayer(username) {
    setSelectedUsername((prev) => (prev === username ? null : username));
  }

  async function openPredSheet(match) {
    setPredMatch(match);
    setPredRows([]);
    setPredActualResult(null);
    setPredError(null);
    setPredLoading(true);
    try {
      const data = await apiRequest(`/predictions/${match.id}/all`, { token });
      const rows = Array.isArray(data) ? data : (data?.predictions ?? []);
      setPredRows(rows);
      setPredActualResult(data?.actualResult ?? null);
    } catch (err) {
      setPredError(err.message || 'Could not load predictions.');
    } finally {
      setPredLoading(false);
    }
  }

  function closePredSheet() {
    setPredMatch(null);
    setPredRows([]);
    setPredActualResult(null);
    setPredError(null);
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
    return (
      <EmptyState
        title={error ? 'Could not load report data' : 'No report data yet'}
        detail={error || 'Reports will appear after fixtures and player predictions are available.'}
      />
    );
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

      </section>

      {/* ── Snapshot stats ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SnapshotCard icon={Trophy} color="amber" label="Top matchday scorer" value={topScorer ? `+${roundPoints(topScorer.selectedDayTotal)}` : '—'} detail={topScorer?.username} />
        <SnapshotCard icon={Crown} color="blue" label="Overall leader" value={leader?.username || '—'} detail={leader ? `${roundPoints(leader.total)} pts total` : undefined} />
        <SnapshotCard icon={Users} color="indigo" label="Players tracked" value={rows.length} detail={`${selectedMatchday?.matches.length || 0} fixtures this day`} />
        <SnapshotCard icon={Zap} color="violet" label="Points awarded" value={totalMatchdayPoints} detail="Total across all players" />
      </section>

      {/* ── Match results for selected day ── */}
      {selectedMatchday?.matches.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selectedMatchday.matches.map((match) => (
            <MatchResultCard key={match.id} match={match} onClick={() => openPredSheet(match)} />
          ))}
        </div>
      )}

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
        <Podium rows={rows} currentUser={currentUser} onSelect={handleSelectPlayer} />
        <div className="space-y-2">
          {rows.map((row) => (
            <StandingsRow
              key={row.id || row.username}
              row={row}
              isCurrentUser={row.username === currentUser?.username}
              isSelected={row.username === selectedUsername}
              onSelect={handleSelectPlayer}
            />
          ))}
        </div>
      </section>

      {/* ── Player analysis side sheet ── */}
      {createPortal(
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setSelectedUsername(null)}
            className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
              spotlightRow ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />

          {/* Sheet panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={spotlightRow ? `Player analysis: ${spotlightRow.username}` : 'Player analysis'}
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${
              spotlightRow ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Sheet header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <Award className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <div className="leading-tight">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Player Analysis</p>
                  <p className="text-sm font-black text-slate-950">{spotlightRow?.username ?? '—'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUsername(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close analysis"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {spotlightRow && (
                <PlayerSpotlight
                  row={spotlightRow}
                  matchdays={matchdays}
                  allRows={rows}
                  fixturesById={fixturesById}
                />
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ── Match predictions sheet ── */}
      {createPortal(
        <>
          <div
            aria-hidden="true"
            onClick={closePredSheet}
            className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
              predMatch ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={predMatch ? `Predictions: ${matchTitle(predMatch)}` : 'Match predictions'}
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${
              predMatch ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Sheet header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Eye className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
                <div className="leading-tight min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">All Predictions</p>
                  <p className="truncate text-sm font-black text-slate-950">{predMatch ? matchTitle(predMatch) : '—'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePredSheet}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5">
              {predMatch && (
                <>
                  {/* Match result banner */}
                  <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-col items-center gap-1.5">
                      <Flag team={predMatch.home} />
                      <p className="line-clamp-2 text-center text-xs font-bold text-slate-900">{teamName(predMatch.home)}</p>
                    </div>
                    <div className="text-center">
                      {hasMatchScore(predMatch) ? (
                        <p className="text-3xl font-black tabular-nums text-slate-950">{scoreText(predMatch)}</p>
                      ) : (
                        <p className="text-base font-black uppercase text-slate-400">VS</p>
                      )}
                      <p className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${
                        displayStatus(predMatch) === 'FINISHED' ? 'text-blue-600' :
                        displayStatus(predMatch) === 'LIVE' ? 'text-red-600' : 'text-amber-600'
                      }`}>{displayStatus(predMatch)}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <Flag team={predMatch.away} />
                      <p className="line-clamp-2 text-center text-xs font-bold text-slate-900">{teamName(predMatch.away)}</p>
                    </div>
                  </div>

                  {predLoading && (
                    <div className="flex items-center justify-center gap-2.5 py-16 text-sm font-medium text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      Loading predictions…
                    </div>
                  )}

                  {predError && !predLoading && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-8 text-center">
                      <Lock className="h-8 w-8 text-amber-400" aria-hidden="true" />
                      <div>
                        <p className="font-bold text-slate-900">Predictions hidden</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {predError.includes('kickoff') || predError.includes('hidden')
                            ? 'Predictions are revealed once the match kicks off.'
                            : predError}
                        </p>
                      </div>
                    </div>
                  )}

                  {!predLoading && !predError && predRows.length === 0 && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-10 text-center">
                      <AlertCircle className="h-8 w-8 text-slate-300" aria-hidden="true" />
                      <div>
                        <p className="font-bold text-slate-900">No predictions yet</p>
                        <p className="mt-1 text-sm text-slate-500">No players have submitted a prediction for this match.</p>
                      </div>
                    </div>
                  )}

                  {!predLoading && !predError && predRows.length > 0 && (
                    <PredictionsTable rows={predRows} currentUser={currentUser} matchDate={predMatch?.date} actualResult={predActualResult} />
                  )}
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

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
