'use strict';

const fifaClient = require('../../clients/fifaClient');
const logger = require('../../shared/logging/logger');
const { getCalendarResults } = require('../fixtures/fixtures.cache');
const { isKnockoutMatch, mapKnockoutBracket } = require('./fifaKnockout.mapper');

async function enrichLiveMatch(match) {
  if (match.MatchStatus !== 3) return { match, live: null };

  try {
    const live = await fifaClient.getLive(match.IdStage, match.IdMatch);
    return { match, live };
  } catch (err) {
    logger.error(`live knockout enrich failed for match ${match.IdMatch}:`, err.message);
    return { match, live: null };
  }
}

async function getKnockoutBracket() {
  const raw = await getCalendarResults();
  const knockoutMatches = raw.filter(isKnockoutMatch);
  const enriched = await Promise.all(knockoutMatches.map(enrichLiveMatch));
  return mapKnockoutBracket(enriched);
}

module.exports = { getKnockoutBracket };
