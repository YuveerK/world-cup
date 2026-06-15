'use strict';

const asyncHandler = require('../../shared/http/asyncHandler');
const svc = require('./predictions.service');

const submit = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const raw = req.body;
  const scores = {
    ft_home: parseInt(raw.ft_home, 10),
    ft_away: parseInt(raw.ft_away, 10),
    ht_home: raw.ht_home != null ? parseInt(raw.ht_home, 10) : null,
    ht_away: raw.ht_away != null ? parseInt(raw.ht_away, 10) : null,
  };
  const result = await svc.savePrediction(req.user.id, matchId, scores);
  res.json({ success: true, ...result });
});

const getMyPredictions = asyncHandler(async (req, res) => {
  const predictions = await svc.getMyPredictions(req.user.id);
  res.json({ predictions });
});

const getMyPoints = asyncHandler(async (req, res) => {
  const points = await svc.getMyPoints(req.user.id);
  res.json({ points });
});

const getMatchPredictions = asyncHandler(async (req, res) => {
  const { predictions, actualResult } = await svc.getPredictionsForMatch(req.params.matchId);
  res.json({ predictions, actualResult });
});

module.exports = { submit, getMyPredictions, getMyPoints, getMatchPredictions };
