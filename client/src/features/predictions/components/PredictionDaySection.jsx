import { CalendarDays } from 'lucide-react';
import { formatDayHeading } from '@/lib/date/index';
import { PredictionCard } from './PredictionCard';

export function PredictionDaySection({
  group,
  drafts = {},
  updateDraft,
  savePrediction,
  predictionsByMatch,
  pointsByMatch,
  savingMatchId,
  onViewStats,
  onViewPredictions,
}) {
  return (
    <section>
      <div className="z-10 mb-3 flex items-center gap-3 lg:sticky lg:top-[88px]">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3.5 py-1.5 shadow-sm backdrop-blur">
          <CalendarDays className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-900">{formatDayHeading(group.date)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            {group.matches.length}
          </span>
          {group.hasLive && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
              </span>
              Live
            </span>
          )}
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {group.matches.map((match) => (
          <PredictionCard
            key={match.id}
            match={match}
            draft={drafts[String(match.id)] || {}}
            updateDraft={updateDraft}
            savePrediction={savePrediction}
            prediction={predictionsByMatch.get(String(match.id))}
            points={pointsByMatch.get(String(match.id))}
            saving={savingMatchId === String(match.id)}
            onViewStats={onViewStats}
            onViewPredictions={onViewPredictions}
          />
        ))}
      </div>
    </section>
  );
}
