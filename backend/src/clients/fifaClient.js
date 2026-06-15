'use strict';

const axios = require('axios');
const {
  FIFA_BASE,
  FDH_BASE,
  COMPETITION,
  SEASON,
  FIRST_STAGE,
  FIFA_TIMEOUT_MS,
  FDH_TIMEOUT_MS,
} = require('../config/constants');

const HTTP_HEADERS = { 'User-Agent': 'Mozilla/5.0' };

function rawGet(url, timeoutMs) {
  return axios.get(url, { headers: HTTP_HEADERS, timeout: timeoutMs }).then((r) => r.data);
}

function getCalendar() {
  return rawGet(
    `${FIFA_BASE}/calendar/matches?idCompetition=${COMPETITION}&idSeason=${SEASON}&count=500&language=en`,
    FIFA_TIMEOUT_MS
  );
}

function getLive(stageId, matchId) {
  return rawGet(
    `${FIFA_BASE}/live/football/${COMPETITION}/${SEASON}/${stageId}/${matchId}?language=en`,
    FIFA_TIMEOUT_MS
  );
}

function getTimeline(stageId, matchId) {
  return rawGet(
    `${FIFA_BASE}/timelines/${COMPETITION}/${SEASON}/${stageId}/${matchId}?language=en`,
    FIFA_TIMEOUT_MS
  );
}

function getTeamStats(ifesId) {
  return rawGet(`${FDH_BASE}/stats/match/${ifesId}/teams.json`, FDH_TIMEOUT_MS);
}

function getStandings() {
  return rawGet(
    `${FIFA_BASE}/calendar/${COMPETITION}/${SEASON}/${FIRST_STAGE}/standing?language=en&count=200`,
    FIFA_TIMEOUT_MS
  );
}

module.exports = { getCalendar, getLive, getTimeline, getTeamStats, getStandings };
