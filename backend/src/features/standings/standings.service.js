'use strict';

const { getStandings } = require('../../clients/fifaClient');
const { groupAndSort }  = require('./fifaStandings.mapper');

async function getGroupStandings() {
  const data = await getStandings();
  return groupAndSort(data.Results || []);
}

module.exports = { getGroupStandings };
