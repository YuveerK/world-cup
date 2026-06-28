import { useState, useEffect } from 'react';
import { numberOrBlank } from '@/lib/utils/number';

export function usePredictionDrafts(predictions) {
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    setDrafts(current => {
      // Empty predictions means logged-out or account switch — wipe all drafts
      if (!predictions.length) return {};
      const next = { ...current };
      predictions.forEach(p => {
        const id = String(p.match_id);
        if (!next[id]) next[id] = {
          ht_home: numberOrBlank(p.ht_home),
          ht_away: numberOrBlank(p.ht_away),
          ft_home: numberOrBlank(p.ft_home),
          ft_away: numberOrBlank(p.ft_away),
          et_ht_home: numberOrBlank(p.et_ht_home),
          et_ht_away: numberOrBlank(p.et_ht_away),
          et_ft_home: numberOrBlank(p.et_ft_home),
          et_ft_away: numberOrBlank(p.et_ft_away),
          pen_home: numberOrBlank(p.pen_home),
          pen_away: numberOrBlank(p.pen_away),
        };
      });
      return next;
    });
  }, [predictions]);

  function updateDraft(matchId, field, value) {
    const cleanValue = value === '' ? '' : String(Math.max(0, Number.parseInt(value, 10) || 0));
    setDrafts(current => ({
      ...current,
      [String(matchId)]: { ...(current[String(matchId)] || {}), [field]: cleanValue },
    }));
  }

  return { drafts, updateDraft };
}
