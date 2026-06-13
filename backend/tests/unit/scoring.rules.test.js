'use strict';

const {
  scoreAllPredictions,
  scoreHalfTimePredictions,
  computeClosest,
  HT_EXACT_PTS,
  FT_EXACT_PTS,
  CLOSEST_TOTAL_PTS,
  OUTCOME_PTS,
} = require('../../src/features/scoring/scoring.rules');

describe('computeClosest', () => {
  test('single prediction wins all closest pts', () => {
    const preds = [{ user_id: 'a', ft_home: 2, ft_away: 1 }];
    const { winnerIds, ptsEach } = computeClosest(preds, { home: 2, away: 1 });
    expect(winnerIds.has('a')).toBe(true);
    expect(ptsEach).toBe(CLOSEST_TOTAL_PTS);
  });

  test('closest pts split equally among tied predictors', () => {
    const preds = [
      { user_id: 'a', ft_home: 1, ft_away: 0 },
      { user_id: 'b', ft_home: 1, ft_away: 0 },
    ];
    const { winnerIds, ptsEach } = computeClosest(preds, { home: 2, away: 1 });
    expect(winnerIds.has('a')).toBe(true);
    expect(winnerIds.has('b')).toBe(true);
    expect(ptsEach).toBe(CLOSEST_TOTAL_PTS / 2);
  });

  test('only the nearest predictor wins when distances differ', () => {
    const preds = [
      { user_id: 'near', ft_home: 2, ft_away: 0 }, // dist = 1
      { user_id: 'far', ft_home: 0, ft_away: 0 },  // dist = 3
    ];
    const { winnerIds } = computeClosest(preds, { home: 2, away: 1 });
    expect(winnerIds.has('near')).toBe(true);
    expect(winnerIds.has('far')).toBe(false);
  });
});

describe('scoreAllPredictions', () => {
  const ft = { home: 2, away: 1 };
  const ht = { home: 1, away: 0 };

  test('exact FT + HT correct earns maximum pts', () => {
    const preds = [{ user_id: 'a', ft_home: 2, ft_away: 1, ht_home: 1, ht_away: 0 }];
    const [row] = scoreAllPredictions(preds, ft, ht);
    expect(row.ft_pts).toBe(FT_EXACT_PTS);
    expect(row.ht_pts).toBe(HT_EXACT_PTS);
    expect(row.outcome_pts).toBe(OUTCOME_PTS);
    expect(row.closest_pts).toBe(CLOSEST_TOTAL_PTS);
  });

  test('wrong FT but correct outcome earns outcome_pts only', () => {
    const preds = [{ user_id: 'a', ft_home: 3, ft_away: 1, ht_home: 0, ht_away: 0 }];
    const [row] = scoreAllPredictions(preds, ft, ht);
    expect(row.ft_pts).toBe(0);
    expect(row.outcome_pts).toBe(OUTCOME_PTS);
  });

  test('draw prediction against home-win result earns zero outcome pts', () => {
    const preds = [{ user_id: 'a', ft_home: 1, ft_away: 1, ht_home: 0, ht_away: 0 }];
    const [row] = scoreAllPredictions(preds, ft, ht);
    expect(row.outcome_pts).toBe(0);
  });

  test('wrong HT earns zero ht_pts', () => {
    const preds = [{ user_id: 'a', ft_home: 2, ft_away: 1, ht_home: 0, ht_away: 1 }];
    const [row] = scoreAllPredictions(preds, ft, ht);
    expect(row.ht_pts).toBe(0);
    expect(row.ft_pts).toBe(FT_EXACT_PTS);
  });

  test('no HT provided means ht_pts is always 0', () => {
    const preds = [{ user_id: 'a', ft_home: 2, ft_away: 1, ht_home: 1, ht_away: 0 }];
    const [row] = scoreAllPredictions(preds, ft, null);
    expect(row.ht_pts).toBe(0);
  });

  test('null ht_home/ht_away on prediction means ht_pts is 0', () => {
    const preds = [{ user_id: 'a', ft_home: 2, ft_away: 1, ht_home: null, ht_away: null }];
    const [row] = scoreAllPredictions(preds, ft, ht);
    expect(row.ht_pts).toBe(0);
  });
});

describe('scoreHalfTimePredictions', () => {
  const ht = { home: 1, away: 0 };
  const existing = new Map([['a', { ft_pts: 10, closest_pts: 6, outcome_pts: 4 }]]);

  test('preserves existing FT/outcome/closest pts on correct HT', () => {
    const preds = [{ user_id: 'a', ht_home: 1, ht_away: 0 }];
    const [row] = scoreHalfTimePredictions(preds, ht, existing);
    expect(row.ht_pts).toBe(HT_EXACT_PTS);
    expect(row.ft_pts).toBe(10);
    expect(row.closest_pts).toBe(6);
    expect(row.outcome_pts).toBe(4);
  });

  test('wrong HT gives 0 ht_pts but still preserves other pts', () => {
    const preds = [{ user_id: 'a', ht_home: 0, ht_away: 1 }];
    const [row] = scoreHalfTimePredictions(preds, ht, existing);
    expect(row.ht_pts).toBe(0);
    expect(row.ft_pts).toBe(10);
  });

  test('user with no existing points defaults all to 0', () => {
    const preds = [{ user_id: 'new', ht_home: 1, ht_away: 0 }];
    const [row] = scoreHalfTimePredictions(preds, ht, new Map());
    expect(row.ht_pts).toBe(HT_EXACT_PTS);
    expect(row.ft_pts).toBe(0);
    expect(row.closest_pts).toBe(0);
    expect(row.outcome_pts).toBe(0);
  });
});
