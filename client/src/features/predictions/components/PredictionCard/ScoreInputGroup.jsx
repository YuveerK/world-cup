export function ScoreInputGroup({ label, homeValue, awayValue, onHome, onAway, required, disabled }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}{required && <span className="ml-1 text-rose-400">*</span>}
      </p>
      <div className="flex items-center gap-2">
        <input
          className="score-field"
          type="number"
          min="0"
          inputMode="numeric"
          value={homeValue}
          onChange={(e) => onHome(e.target.value)}
          aria-label={`${label} home score`}
          disabled={disabled}
        />
        <span className="text-base font-medium text-slate-300">—</span>
        <input
          className="score-field"
          type="number"
          min="0"
          inputMode="numeric"
          value={awayValue}
          onChange={(e) => onAway(e.target.value)}
          aria-label={`${label} away score`}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
