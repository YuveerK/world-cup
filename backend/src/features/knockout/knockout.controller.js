'use strict';

const asyncHandler = require('../../shared/http/asyncHandler');
const { getKnockoutBracket } = require('./knockout.service');

const getBracket = asyncHandler(async (req, res) => {
  const bracket = await getKnockoutBracket();
  res.json({
    success: true,
    totalRounds: bracket.rounds.length,
    totalMatches: bracket.matches.length,
    rounds: bracket.rounds,
  });
});

module.exports = { getBracket };
