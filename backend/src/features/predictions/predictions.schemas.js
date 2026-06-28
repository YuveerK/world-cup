'use strict';

const { ValidationError } = require('../../shared/http/errors');

function parseOptionalPair(rawA, rawB) {
  if (rawA == null && rawB == null) return [null, null];
  return [rawA != null ? parseInt(rawA, 10) : null, rawB != null ? parseInt(rawB, 10) : null];
}

// Returns the fully parsed prediction fields. Callers should use the returned object
// rather than re-reading req.body so all parsing happens in one place.
function validateSubmitPrediction(req) {
  const raw = req.body;
  const ft_home = parseInt(raw.ft_home, 10);
  const ft_away = parseInt(raw.ft_away, 10);
  if ([ft_home, ft_away].some((v) => Number.isNaN(v) || v < 0)) {
    throw new ValidationError('ft_home and ft_away are required and must be non-negative integers');
  }

  const ht_home = raw.ht_home != null ? parseInt(raw.ht_home, 10) : null;
  const ht_away = raw.ht_away != null ? parseInt(raw.ht_away, 10) : null;
  if ((ht_home === null) !== (ht_away === null)) {
    throw new ValidationError('Provide both ht_home and ht_away, or neither');
  }
  if ([ht_home, ht_away].some((v) => v !== null && (Number.isNaN(v) || v < 0))) {
    throw new ValidationError('ht_home and ht_away must be valid scores');
  }
  if (ht_home !== null && (ht_home > ft_home || ht_away > ft_away)) {
    throw new ValidationError('Half time scores cannot exceed full time scores');
  }

  // ET fields — only valid when FT is a draw.
  const [et_ft_home, et_ft_away] = parseOptionalPair(raw.et_ft_home, raw.et_ft_away);
  const [et_ht_home, et_ht_away] = parseOptionalPair(raw.et_ht_home, raw.et_ht_away);

  if (et_ft_home !== null || et_ft_away !== null) {
    if ((et_ft_home === null) !== (et_ft_away === null)) {
      throw new ValidationError('Provide both et_ft_home and et_ft_away, or neither');
    }
    if (ft_home !== ft_away) {
      throw new ValidationError('ET predictions are only allowed when FT is predicted as a draw');
    }
    if ([et_ft_home, et_ft_away].some((v) => Number.isNaN(v) || v < 0)) {
      throw new ValidationError('ET scores must be non-negative integers');
    }
    // ET FT is cumulative — must be >= FT scores
    if (et_ft_home < ft_home || et_ft_away < ft_away) {
      throw new ValidationError('ET full time scores must be >= full time scores (ET is cumulative)');
    }
  }
  if (et_ht_home !== null || et_ht_away !== null) {
    if ((et_ht_home === null) !== (et_ht_away === null)) {
      throw new ValidationError('Provide both et_ht_home and et_ht_away, or neither');
    }
    if ([et_ht_home, et_ht_away].some((v) => Number.isNaN(v) || v < 0)) {
      throw new ValidationError('ET HT scores must be non-negative integers');
    }
    // ET HT is cumulative — must be >= FT scores
    if (et_ht_home < ft_home || et_ht_away < ft_away) {
      throw new ValidationError('ET half time scores must be >= full time scores (ET is cumulative)');
    }
    // ET FT must also be >= ET HT when both provided
    if (et_ft_home !== null && (et_ft_home < et_ht_home || et_ft_away < et_ht_away)) {
      throw new ValidationError('ET full time scores must be >= ET half time scores');
    }
  }

  // Penalty fields — only valid when ET FT is also a draw.
  const [pen_home, pen_away] = parseOptionalPair(raw.pen_home, raw.pen_away);

  if (pen_home !== null || pen_away !== null) {
    if ((pen_home === null) !== (pen_away === null)) {
      throw new ValidationError('Provide both pen_home and pen_away, or neither');
    }
    if (et_ft_home === null || et_ft_home !== et_ft_away) {
      throw new ValidationError('Penalty predictions are only allowed when ET FT is predicted as a draw');
    }
    if ([pen_home, pen_away].some((v) => Number.isNaN(v) || v < 0)) {
      throw new ValidationError('Penalty scores must be non-negative integers');
    }
    if (pen_home === pen_away) {
      throw new ValidationError('Penalty shootout cannot end in a draw — one team must win');
    }
  }

  return { ft_home, ft_away, ht_home, ht_away, et_ht_home, et_ht_away, et_ft_home, et_ft_away, pen_home, pen_away };
}

module.exports = { validateSubmitPrediction };
