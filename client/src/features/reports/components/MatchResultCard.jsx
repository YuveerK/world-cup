import { Eye } from 'lucide-react';
import { Flag } from '@/features/matches/components/Flag';
import { displayStatus, hasMatchScore, scoreText } from '@/features/matches/utils/matchStatus';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { ConsensusBar } from './ConsensusBar';

export function MatchResultCard({ match, onClick, consensus }) {
  const status = displayStatus(match);
  const live = status === 'LIVE';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm text-left transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex flex-col items-center gap-1.5">
          <Flag team={match.home} />
          <p className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-slate-900">
            {teamName(match.home)}
          </p>
        </div>

        <div className="shrink-0 px-3 text-center">
          {hasMatchScore(match) ? (
            <p className="whitespace-nowrap text-2xl font-black tabular-nums leading-none text-slate-950">
              {scoreText(match)}
            </p>
          ) : (
            <p className="whitespace-nowrap text-base font-black uppercase leading-none text-slate-400">VS</p>
          )}
          {live ? (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              LIVE
            </span>
          ) : (
            <p className={`mt-1.5 text-[10px] font-bold uppercase tracking-wide ${status === 'FINISHED' ? 'text-blue-600' : 'text-amber-600'}`}>
              {status || 'UPCOMING'}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <Flag team={match.away} />
          <p className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-slate-900">
            {teamName(match.away)}
          </p>
        </div>
      </div>

      <ConsensusBar matchId={match.id} consensus={consensus} />

      <div className="mt-2 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-blue-500 transition group-hover:text-blue-700">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View all predictions
      </div>
    </button>
  );
}
