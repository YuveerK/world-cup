import { displayStatus, hasMatchScore } from '@/features/matches/utils/matchStatus';
import { dayKeyOf } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';

export function groupFixturesByMatchday(fixtures) {
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

export function isActiveReportDay(group) {
  return group.matches.some((m) => displayStatus(m) === 'LIVE' || displayStatus(m) === 'FINISHED' || hasMatchScore(m));
}

export function entryFor(row, matchId) {
  return row.match_points?.find((e) => String(e.match_id) === String(matchId)) || null;
}

function entryTotal(entry) {
  return roundPoints(entry?.match_total || 0);
}

function rankRows(rows, dayIndex, field) {
  if (dayIndex < 0) return rows.map((row) => ({ ...row, [field]: null }));
  const ranked = [...rows]
    .sort((a, b) => (b.cumulativeTotals[dayIndex] || 0) - (a.cumulativeTotals[dayIndex] || 0) || a.username.localeCompare(b.username))
    .map((row, i) => ({ id: row.id, username: row.username, rank: i + 1 }));
  const rankMap = new Map(ranked.map((r) => [String(r.id ?? r.username), r.rank]));
  return rows.map((row) => ({ ...row, [field]: rankMap.get(String(row.id ?? row.username)) || null }));
}

export function buildRows(leaderboard, matchdays, selectedIndex) {
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

    const activeIndices = matchdays
      .map((day, i) => ({ i, active: isActiveReportDay(day) }))
      .filter((d) => d.active)
      .map((d) => d.i);
    const activeTotals = activeIndices.map((i) => dayTotals[i] || 0);
    const activeMean = activeTotals.length ? activeTotals.reduce((a, b) => a + b, 0) / activeTotals.length : 0;
    const stdDev = activeTotals.length >= 2
      ? Math.round(Math.sqrt(activeTotals.reduce((s, v) => s + (v - activeMean) ** 2, 0) / activeTotals.length) * 10) / 10
      : 0;

    const last3 = activeTotals.slice(-3);
    let streak = 0;
    if (last3.length >= 2) {
      const allUp = last3.slice(1).every((v, i) => v > last3[i]);
      const allDown = last3.slice(1).every((v, i) => v < last3[i]);
      streak = allUp ? last3.length - 1 : allDown ? -(last3.length - 1) : 0;
    }

    const perfectPredictions = allEntries.filter((e) => (e.ht_pts || 0) > 0 && (e.ft_pts || 0) > 0).length;
    const bestDay = activeTotals.length ? Math.max(0, ...activeTotals) : 0;
    const matchdayAccuracy = matchdays.map((day) => {
      const dayEnts = day.matches.map((m) => entryFor(player, m.id)).filter(Boolean);
      const sc = dayEnts.filter((e) => e.scored);
      return sc.length ? Math.round((sc.filter((e) => roundPoints(e.match_total || 0) > 0).length / sc.length) * 100) : null;
    });

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
      stdDev,
      streak,
      perfectPredictions,
      bestDay,
      matchdayAccuracy,
    };
  });

  const withRank = rankRows(rows, selectedIndex, 'selectedRank');
  const withPrev = rankRows(withRank, selectedIndex - 1, 'previousRank');
  const firstActiveIndex = Math.max(0, matchdays.findIndex(isActiveReportDay));
  const withInitial = rankRows(withPrev, firstActiveIndex, 'initialRank');
  return withInitial
    .map((row) => ({
      ...row,
      rankChange: row.previousRank && row.selectedRank ? row.previousRank - row.selectedRank : 0,
    }))
    .sort((a, b) => a.selectedRank - b.selectedRank || a.username.localeCompare(b.username));
}

export function buildMatchInsights(rows) {
  const matchMap = new Map();
  rows.forEach((row) => {
    (row.match_points || []).forEach((entry) => {
      const id = String(entry.match_id);
      if (!matchMap.has(id)) matchMap.set(id, { total: 0, outcomeCorrect: 0, predictions: [] });
      const m = matchMap.get(id);
      m.predictions.push(entry.prediction);
      if (entry.scored) {
        m.total++;
        if ((entry.outcome_pts || 0) > 0) m.outcomeCorrect++;
      }
    });
  });

  let biggestUpset = null;
  let lowestRate = Infinity;
  matchMap.forEach((data, matchId) => {
    if (data.total < 2) return;
    const rate = data.outcomeCorrect / data.total;
    if (rate < lowestRate) {
      lowestRate = rate;
      biggestUpset = { matchId, pct: Math.round(rate * 100), correct: data.outcomeCorrect, total: data.total };
    }
  });

  const consensus = new Map();
  matchMap.forEach((data, matchId) => {
    const votes = { home: 0, draw: 0, away: 0 };
    data.predictions.forEach((p) => {
      if (p?.ft_home == null) return;
      if (p.ft_home > p.ft_away) votes.home++;
      else if (p.ft_home < p.ft_away) votes.away++;
      else votes.draw++;
    });
    const total = votes.home + votes.draw + votes.away;
    const max = Math.max(votes.home, votes.draw, votes.away);
    consensus.set(matchId, { votes, total, leadPct: total > 0 ? Math.round((max / total) * 100) : 0 });
  });

  return { biggestUpset, consensus };
}

export function buildTournamentInsights(rows, matchdays) {
  if (!rows.length) return null;

  const htLeader = [...rows].sort((a, b) => (b.ht_pts || 0) - (a.ht_pts || 0))[0];
  const ftLeader = [...rows].sort((a, b) => (b.ft_pts || 0) - (a.ft_pts || 0))[0];
  const closestLeader = [...rows].sort((a, b) => (b.closest_pts || 0) - (a.closest_pts || 0))[0];
  const outcomeLeader = [...rows].sort((a, b) => (b.outcome_pts || 0) - (a.outcome_pts || 0))[0];

  const eligible = rows.filter((r) => (r.match_points || []).filter((e) => e.scored).length >= 3);
  const consistent = eligible.length ? [...eligible].sort((a, b) => (a.stdDev || 0) - (b.stdDev || 0))[0] : null;

  let biggestHaul = { username: '', pts: 0, matchdayLabel: '' };
  rows.forEach((row) => {
    (row.dayTotals || []).forEach((pts, i) => {
      if (pts > biggestHaul.pts) biggestHaul = { username: row.username, pts, matchdayLabel: `MD${i + 1}` };
    });
  });

  const biggestComeback = rows
    .filter((r) => r.initialRank && r.selectedRank && r.initialRank > r.selectedRank)
    .sort((a, b) => (a.selectedRank - a.initialRank) - (b.selectedRank - b.initialRank))[0];

  const mostPerfect = [...rows].sort((a, b) => (b.perfectPredictions || 0) - (a.perfectPredictions || 0))[0];

  const matchdayDifficulty = matchdays
    .map((day, i) => ({
      label: `MD${i + 1}`,
      active: isActiveReportDay(day),
      totalPts: rows.reduce((sum, r) => sum + roundPoints((r.dayTotals || [])[i] || 0), 0),
    }))
    .filter((d) => d.active);

  return { htLeader, ftLeader, closestLeader, outcomeLeader, consistent, biggestHaul, biggestComeback, mostPerfect, matchdayDifficulty };
}
