import { useState, useEffect } from 'react';
import { numberOrBlank } from '@/lib/utils/number';

export function usePredictionDrafts(predictions) {
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    setDrafts(current => {
      const next = { ...current };
      predictions.forEach(p => {
        const id = String(p.match_id);
        if (!next[id]) next[id] = {
          ht_home: numberOrBlank(p.ht_home),
          ht_away: numberOrBlank(p.ht_away),
          ft_home: numberOrBlank(p.ft_home),
          ft_away: numberOrBlank(p.ft_away),
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
