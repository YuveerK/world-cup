import { Flag } from '@/features/matches/components/Flag';
import { teamName } from '@/features/matches/utils/matchFormatters';

export function TeamBlock({ team, align }) {
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <div className="shrink-0">
        <Flag team={team} />
      </div>
      <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
        {/* Mobile: abbreviation as primary, full name below */}
        <h3 className="text-sm font-bold text-slate-900 sm:hidden">
          {team?.abbreviation || teamName(team)}
        </h3>
        <p className="truncate text-[10px] font-medium leading-tight text-slate-400 sm:hidden">
          {teamName(team)}
        </p>
        {/* sm+: full name as primary, abbreviation below */}
        <h3 className="hidden truncate text-sm font-semibold text-slate-900 sm:block sm:text-base">
          {teamName(team)}
        </h3>
        {team?.abbreviation && (
          <p className="mt-0.5 hidden text-xs font-medium text-slate-400 sm:block">
            {team.abbreviation}
          </p>
        )}
      </div>
    </div>
  );
}
