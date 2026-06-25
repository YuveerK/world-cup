'use strict';

const { getStandings } = require('../../clients/fifaClient');
const { groupAndSort, computeThirdPlaceTable } = require('./fifaStandings.mapper');

async function getGroupStandings() {
  const data = await getStandings();
  const rows = data.Results || [];
  return {
    groups: groupAndSort(rows),
    thirdPlace: computeThirdPlaceTable(rows),
  };
}

module.exports = { getGroupStandings };
