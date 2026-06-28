import { parseScore } from '@/lib/utils/number';

export function buildPredictionBody(match, draft) {
  const isKnockout = !match.group && Boolean(match.stage);

  const ftHome = parseScore(draft.ft_home);
  const ftAway = parseScore(draft.ft_away);
  const htHome = parseScore(draft.ht_home);
  const htAway = parseScore(draft.ht_away);

  const body = { ft_home: ftHome, ft_away: ftAway };
  if (htHome !== null && htAway !== null) { body.ht_home = htHome; body.ht_away = htAway; }

  if (isKnockout) {
    const etFtHome = parseScore(draft.et_ft_home);
    const etFtAway = parseScore(draft.et_ft_away);
    const etHtHome = parseScore(draft.et_ht_home);
    const etHtAway = parseScore(draft.et_ht_away);
    if (etFtHome !== null && etFtAway !== null) { body.et_ft_home = etFtHome; body.et_ft_away = etFtAway; }
    if (etHtHome !== null && etHtAway !== null) { body.et_ht_home = etHtHome; body.et_ht_away = etHtAway; }
    const penHome = parseScore(draft.pen_home);
    const penAway = parseScore(draft.pen_away);
    if (penHome !== null && penAway !== null) { body.pen_home = penHome; body.pen_away = penAway; }
  }

  return { body, ftHome, ftAway, htHome, htAway };
}
