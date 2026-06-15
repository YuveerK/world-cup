import { useState } from 'react';
import { PredictionCard } from '@/features/predictions/components/PredictionCard';

// Always relative to now so the preview works on any date
const PAST = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();   // 3 hrs ago
const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // tomorrow

const HOME = { name: 'Brazil', abbreviation: 'BRA' };
const AWAY = { name: 'Argentina', abbreviation: 'ARG' };

const BASE = { group: 'Group E', stage: 'First Stage', home: HOME, away: AWAY };

const SCENARIOS = [
  {
    label: 'Upcoming — no prediction yet',
    match: { ...BASE, id: 'p1', date: FUTURE, status: 'UPCOMING', score: {} },
    prediction: null,
    points: null,
    draft: { ht_home: '', ht_away: '', ft_home: '', ft_away: '' },
  },
  {
    label: 'Upcoming — saved (pristine button)',
    match: { ...BASE, id: 'p2', date: FUTURE, status: 'UPCOMING', score: {} },
    prediction: { ht_home: 1, ht_away: 0, ft_home: 2, ft_away: 1 },
    points: null,
    draft: { ht_home: '1', ht_away: '0', ft_home: '2', ft_away: '1' },
  },
  {
    label: 'Upcoming — dirty (unsaved change)',
    match: { ...BASE, id: 'p3', date: FUTURE, status: 'UPCOMING', score: {} },
    prediction: { ht_home: 1, ht_away: 0, ft_home: 2, ft_away: 1 },
    points: null,
    // ft_home differs from saved → button becomes active "Update"
    draft: { ht_home: '1', ht_away: '0', ft_home: '3', ft_away: '1' },
  },
  {
    label: 'Live — first half (35\')',
    match: { ...BASE, id: 'p4', date: PAST, status: 'LIVE', minute: '35', score: { home: 1, away: 0 } },
    prediction: { ht_home: 1, ht_away: 0, ft_home: 2, ft_away: 1 },
    points: null,
    draft: { ht_home: '1', ht_away: '0', ft_home: '2', ft_away: '1' },
  },
  {
    label: 'Live — half time (HT scored)',
    match: { ...BASE, id: 'p5', date: PAST, status: 'LIVE', minute: 'HT', phase: 'HALF_TIME', score: { home: 1, away: 0 } },
    prediction: { ht_home: 1, ht_away: 0, ft_home: 2, ft_away: 1 },
    // HT points awarded at the break
    points: { ht_pts: 3, ft_pts: 0, closest_pts: 0, outcome_pts: 0 },
    draft: { ht_home: '1', ht_away: '0', ft_home: '2', ft_away: '1' },
  },
  {
    label: 'Live — second half (72\')',
    match: { ...BASE, id: 'p6', date: PAST, status: 'LIVE', minute: '72', score: { home: 2, away: 1 } },
    prediction: { ht_home: 1, ht_away: 0, ft_home: 2, ft_away: 1 },
    points: { ht_pts: 3, ft_pts: 0, closest_pts: 0, outcome_pts: 0 },
    draft: { ht_home: '1', ht_away: '0', ft_home: '2', ft_away: '1' },
  },
  {
    label: 'Live — stoppage time (90+4\')',
    match: { ...BASE, id: 'p7', date: PAST, status: 'LIVE', minute: '90+4', score: { home: 2, away: 2 } },
    prediction: { ht_home: 1, ht_away: 0, ft_home: 2, ft_away: 1 },
    points: { ht_pts: 3, ft_pts: 0, closest_pts: 0, outcome_pts: 0 },
    draft: { ht_home: '1', ht_away: '0', ft_home: '2', ft_away: '1' },
  },
  {
    label: 'Finished — correct prediction',
    match: { ...BASE, id: 'p8', date: PAST, status: 'FINISHED', score: { home: 2, away: 1 } },
    prediction: { ht_home: 1, ht_away: 0, ft_home: 2, ft_away: 1 },
    points: { ht_pts: 3, ft_pts: 3, closest_pts: 1.5, outcome_pts: 2 },
    draft: { ht_home: '1', ht_away: '0', ft_home: '2', ft_away: '1' },
  },
  {
    label: 'Finished — wrong prediction',
    match: { ...BASE, id: 'p9', date: PAST, status: 'FINISHED', score: { home: 2, away: 1 } },
    prediction: { ht_home: 0, ht_away: 2, ft_home: 0, ft_away: 3 },
    points: { ht_pts: 0, ft_pts: 0, closest_pts: 0, outcome_pts: 0 },
    draft: { ht_home: '0', ht_away: '2', ft_home: '0', ft_away: '3' },
  },
];

export function CardPreviewPage() {
  const [drafts, setDrafts] = useState(
    Object.fromEntries(SCENARIOS.map((s) => [s.match.id, { ...s.draft }])),
  );

  function updateDraft(matchId, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [String(matchId)]: { ...(prev[String(matchId)] || {}), [field]: value },
    }));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Dev only</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">PredictionCard states</h1>
        <p className="mt-1 text-sm text-slate-500">
          All 9 lifecycle states. The top 3 upcoming cards have live inputs — try editing them.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.match.id}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {scenario.label}
            </p>
            <PredictionCard
              match={scenario.match}
              draft={drafts[scenario.match.id] || {}}
              updateDraft={updateDraft}
              savePrediction={() => {}}
              prediction={scenario.prediction}
              points={scenario.points}
              saving={false}
              onViewStats={() => {}}
              onViewPredictions={() => {}}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
