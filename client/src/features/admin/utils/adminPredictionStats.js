export function getAdminPredictionStats(rows = []) {
  const predicted = rows.filter((row) => row.prediction).length;
  return {
    total: rows.length,
    predicted,
    missing: rows.length - predicted,
  };
}
