'use strict';

const fifaClient = require('../../clients/fifaClient');
const { FIXTURES_CACHE_TTL_MS } = require('../../config/constants');

let cache = { at: 0, results: null };

async function getCalendarResults() {
  if (cache.results && Date.now() - cache.at < FIXTURES_CACHE_TTL_MS) {
    return cache.results;
  }
  const data = await fifaClient.getCalendar();
  cache = { at: Date.now(), results: data.Results || [] };
  return cache.results;
}

async function getMatchKickoff(matchId) {
  const results = await getCalendarResults();
  const match = results.find((m) => String(m.IdMatch) === String(matchId));
  return match ? new Date(match.Date) : null;
}

function invalidate() {
  cache = { at: 0, results: null };
}

module.exports = { getCalendarResults, getMatchKickoff, invalidate };
