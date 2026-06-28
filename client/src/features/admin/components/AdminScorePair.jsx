export function AdminScorePair({ label, tone = 'ft', homeValue, awayValue, onHome, onAway, homeLabel, awayLabel }) {
  const toneCls =
    tone === 'ht'  ? 'bg-amber-100 text-amber-700' :
    tone === 'et'  ? 'bg-orange-100 text-orange-700' :
    tone === 'pen' ? 'bg-rose-100 text-rose-700' :
    'bg-blue-100 text-blue-700';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${toneCls}`}>
        {label}
      </span>

      <div className="mt-2.5 flex justify-center">
        <div className="inline-grid grid-cols-[4rem_1.25rem_4rem] items-center gap-x-2 gap-y-1">
          <input
            className="score-field"
            type="number"
            min="0"
            inputMode="numeric"
            value={homeValue}
            onChange={(e) => onHome(e.target.value)}
            aria-label={`${label} ${homeLabel || 'home'} score`}
          />
          <span className="text-center text-sm font-bold text-slate-300">–</span>
          <input
            className="score-field"
            type="number"
            min="0"
            inputMode="numeric"
            value={awayValue}
            onChange={(e) => onAway(e.target.value)}
            aria-label={`${label} ${awayLabel || 'away'} score`}
          />

          <span className="truncate text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {homeLabel || ''}
          </span>
          <span aria-hidden="true" />
          <span className="truncate text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {awayLabel || ''}
          </span>
        </div>
      </div>
    </div>
  );
}
