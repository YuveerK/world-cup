'use strict';

const fifaClient = require('../../clients/fifaClient');
const logger = require('../../shared/logging/logger');
const { NotFoundError } = require('../../shared/http/errors');
const { getAllFixtures } = require('../fixtures/fixtures.service');
const { mapMatchStats } = require('./fifaMatchStats.mapper');

async function getMatchStats(matchId, stageId) {
  let resolvedStageId = stageId;

  if (!resolvedStageId) {
    const fixtures = await getAllFixtures();
    const found = fixtures.find((m) => String(m.id) === String(matchId));
    if (!found) throw new NotFoundError('Match not found');
    resolvedStageId = found.stageId;
  }

  const [live, timeline] = await Promise.all([
    fifaClient.getLive(resolvedStageId, matchId),
    fifaClient.getTimeline(resolvedStageId, matchId).catch((err) => {
      logger.warn(`timeline fetch failed for match ${matchId}:`, err.message);
      return null;
    }),
  ]);

  let teamStatsRaw = null;
  const ifesId = live.Properties?.IdIFES;
  if (ifesId) {
    teamStatsRaw = await fifaClient.getTeamStats(ifesId).catch((err) => {
      logger.warn(`teamStats fetch failed for match ${matchId}:`, err.message);
      return null;
    });
  }

  return mapMatchStats(matchId, live, timeline, teamStatsRaw);
}

module.exports = { getMatchStats };
