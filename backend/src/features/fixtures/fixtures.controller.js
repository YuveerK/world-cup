'use strict';

const asyncHandler = require('../../shared/http/asyncHandler');
const { getAllFixtures } = require('./fixtures.service');

const getFixtures = asyncHandler(async (req, res) => {
  const matches = await getAllFixtures();
  const { group, status, date, grouped } = req.query;

  let filtered = matches;
  if (group) filtered = filtered.filter((m) => m.group?.toLowerCase().includes(group.toLowerCase()));
  if (status) filtered = filtered.filter((m) => m.status === status.toUpperCase());
  if (date) filtered = filtered.filter((m) => m.date?.startsWith(date));

  if (grouped === 'true' || grouped === '1') {
    const byDate = {};
    for (const m of filtered) {
      const day = m.date ? m.date.split('T')[0] : 'Unknown';
      if (!byDate[day]) byDate[day] = [];
      byDate[day].push(m);
    }
    const days = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, dayMatches]) => ({ date: day, matches: dayMatches }));
    return res.json({ success: true, totalDays: days.length, totalMatches: filtered.length, days });
  }

  res.json({ success: true, total: filtered.length, matches: filtered });
});

const getLiveFixtures = asyncHandler(async (req, res) => {
  const matches = await getAllFixtures();
  const live = matches.filter((m) => m.status === 'LIVE');
  res.json({ success: true, total: live.length, matches: live });
});

const getTodayFixtures = asyncHandler(async (req, res) => {
  const matches = await getAllFixtures();
  const today = new Date().toISOString().split('T')[0];
  const todayMatches = matches.filter((m) => m.date?.startsWith(today));
  res.json({ success: true, date: today, total: todayMatches.length, matches: todayMatches });
});

module.exports = { getFixtures, getLiveFixtures, getTodayFixtures };
