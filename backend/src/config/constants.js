'use strict';

module.exports = {
  FIFA_BASE: 'https://api.fifa.com/api/v3',
  FDH_BASE: 'https://fdh-api.fifa.com/v1',
  COMPETITION: '17',
  SEASON: '285023',
  FIRST_STAGE: '289273',   // Group Stage
  FIFA_TIMEOUT_MS: 10_000,
  FDH_TIMEOUT_MS: 8_000,
  FIXTURES_CACHE_TTL_MS: 60_000,
  SCORING_INTERVAL_MS: 30_000,
  // A non-zero 0–0 score is ambiguous (pre-match fixture). Once this much time
  // has elapsed since kickoff, a 0–0 with any status is treated as a real result.
  FINISHED_AFTER_MS: 150 * 60 * 1000,
};
