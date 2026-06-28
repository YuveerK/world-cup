'use strict';

const asyncHandler = require('../../shared/http/asyncHandler');
const { validateSubmitPrediction } = require('./predictions.schemas');
const svc = require('./predictions.service');

const submit = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const scores = validateSubmitPrediction(req);
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
