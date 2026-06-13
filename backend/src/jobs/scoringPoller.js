'use strict';

const { SCORING_INTERVAL_MS } = require('../config/constants');
const logger = require('../shared/logging/logger');
const { checkAndScoreFinishedMatches } = require('../features/scoring/fifaScoring.service');

let intervalId = null;

function start() {
  if (intervalId) return; // already running
  logger.info(`Scoring poller started (interval: ${SCORING_INTERVAL_MS}ms)`);
  // Run immediately on start, then on every interval tick
  checkAndScoreFinishedMatches().catch((err) => logger.error('Initial scoring poll failed:', err.message));
  intervalId = setInterval(() => {
    checkAndScoreFinishedMatches().catch((err) => logger.error('Scoring poll failed:', err.message));
  }, SCORING_INTERVAL_MS);
}

function stop() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  logger.info('Scoring poller stopped');
}

module.exports = { start, stop };
