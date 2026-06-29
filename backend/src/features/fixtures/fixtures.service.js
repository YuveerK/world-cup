'use strict';

const fifaClient = require('../../clients/fifaClient');
const logger = require('../../shared/logging/logger');
const { getCalendarResults } = require('./fixtures.cache');
const { mapMatch } = require('./fifaFixtures.mapper');
const { FINISHED_AFTER_MS } = require('../../config/constants');
const { getEtMatchIds } = require('../scoring/scoring.repository');
const { FIFA_PERIODS } = require('../../config/fifaPeriods');

// Statuses that mean the match is definitively over — no live enrichment needed.
const TERMINAL_STATUSES = new Set([2, 4, 5, 6, 7, 8]);

async function getAllFixtures() {
  const [raw, etMatchIds] = await Promise.all([
    getCalendarResults(),
    getEtMatchIds().catch(() => new Set()),
  ]);
  const now = Date.now();

  const enriched = await Promise.all(
    raw.map(async (match) => {
      const isLiveStatus = match.MatchStatus === 3;

      // Also attempt live enrichment for matches within the live window after
      // kickoff even when the cached calendar still shows MatchStatus 1 (UPCOMING).
      // The calendar cache can be up to 60 s stale, so a match can appear
      // UPCOMING in the cache for a full minute after it actually kicks off.
      // The live endpoint's MatchStatus takes precedence via mapStatus(m, live).
      const kickoff = new Date(match.Date || 0).getTime();
      const isPastKickoff = kickoff <= now && now - kickoff < FINISHED_AFTER_MS;
      const isTerminal = TERMINAL_STATUSES.has(match.MatchStatus);
      // A terminal match still at a HT interval is anomalous — the calendar may have
      // prematurely marked the match finished during a weather suspension. Always fetch
      // live data in this case regardless of the FINISHED_AFTER_MS window.
      const isAnomalousHalfTimeFinish = isTerminal && (match.Period === FIFA_PERIODS.REGULAR_HT || match.Period === FIFA_PERIODS.ET_HT);
      const needsLiveCheck = isLiveStatus || (isPastKickoff && !isTerminal) || isAnomalousHalfTimeFinish;

      if (!needsLiveCheck) return { match, live: null };
      try {
        const live = await fifaClient.getLive(match.IdStage, match.IdMatch);
        return { match, live };
      } catch (err) {
        logger.error(`live fixture enrich failed for match ${match.IdMatch}:`, err.message);
        return { match, live: null };
      }
    })
  );

  return enriched.map(({ match, live }) => mapMatch(match, live, etMatchIds));
}

module.exports = { getAllFixtures };
