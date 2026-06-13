import { Loader2, Save, Trophy } from 'lucide-react';

export function WinnerPicker({ user, teams, winnerPick, setWinnerPick, saveWinnerPick, savingWinner }) {
  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-50">
            <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Tournament winner</h2>
            <p className="text-sm text-slate-500">
              Current pick: <span className="font-semibold text-slate-800">{user?.winner || user?.pick1 || 'Not set'}</span>
            </p>
          </div>
        </div>
        <div className="grid w-full gap-2 md:w-[400px] md:grid-cols-[1fr_auto]">
          <select className="field" value={winnerPick} onChange={(e) => setWinnerPick(e.target.value)}>
            <option value="">Choose a team</option>
            {teams.map((team) => (
              <option key={team.name} value={team.name}>{team.name}</option>
            ))}
          </select>
          <button className="btn btn-primary w-full md:w-auto" onClick={saveWinnerPick} disabled={savingWinner || !teams.length}>
            {savingWinner ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
