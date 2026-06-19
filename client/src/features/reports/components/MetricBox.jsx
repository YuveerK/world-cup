export function MetricBox({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <Icon className="mb-2 h-5 w-5 text-slate-400" aria-hidden="true" />
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-2xl font-black text-slate-950">{value}</p>
      {sub && <p className="mt-0.5 text-xs font-medium text-slate-400">{sub}</p>}
    </div>
  );
}
