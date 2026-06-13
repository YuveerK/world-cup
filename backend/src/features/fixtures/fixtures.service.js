'use strict';

const fifaClient = require('../../clients/fifaClient');
const logger = require('../../shared/logging/logger');
const { getCalendarResults } = require('./fixtures.cache');
const { mapMatch } = require('./fifaFixtures.mapper');

async function getAllFixtures() {
  const raw = await getCalendarResults();

  const enriched = await Promise.all(
    raw.map(async (match) => {
      if (match.MatchStatus !== 3) return { match, live: null };
      try {
        const live = await fifaClient.getLive(match.IdStage, match.IdMatch);
        return { match, live };
      } catch (err) {
        logger.error(`live fixture enrich failed for match ${match.IdMatch}:`, err.message);
        return { match, live: null };
      }
    })
  );

  return enriched.map(({ match, live }) => mapMatch(match, live));
}

module.exports = { getAllFixtures };
