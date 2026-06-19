const COLOR_MAP = {
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  teal: 'bg-teal-50 text-teal-600',
  orange: 'bg-orange-50 text-orange-600',
};

export function SnapshotCard({ icon: Icon, color, label, value, detail }) {
  return (
    <div className="panel p-3 sm:p-4">
      <div className={`mb-2.5 grid h-8 w-8 place-items-center rounded-xl sm:mb-3 sm:h-9 sm:w-9 ${COLOR_MAP[color] || COLOR_MAP.blue}`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">{label}</p>
      <p className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">{value}</p>
      {detail && <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500 sm:text-xs">{detail}</p>}
    </div>
  );
}
