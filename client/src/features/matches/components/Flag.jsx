export function Flag({ team }) {
  if (!team?.flagUrl) {
    return (
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-xs font-bold text-slate-400 ring-1 ring-slate-200 sm:h-10 sm:w-10">
        {team?.abbreviation || '--'}
      </span>
    );
  }

  return (
    <img
      src={team.flagUrl}
      alt=""
      className="h-9 w-9 rounded-lg object-cover shadow-sm ring-1 ring-slate-200 sm:h-10 sm:w-10"
      loading="lazy"
    />
  );
}
