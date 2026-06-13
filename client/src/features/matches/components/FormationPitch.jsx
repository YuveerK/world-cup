import { ArrowDown } from 'lucide-react';
import { teamName } from '../utils/matchFormatters';

function BallIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
      <path d="M12 6.5l3.2 2.3-1.2 3.8h-4L8.8 8.8z" fill="#0f172a" />
    </svg>
  );
}

// Pull the incoming player's name out of a substitution description, e.g.
// "H C HWANG (in) comes off the bench to replace J S LEE (out) (Korea Republic)".
function parseSubOnName(desc = '') {
  const match = /^(.*?)\s*\(in\)/.exec(desc || '');
  return match ? match[1].trim() : null;
}

// Aggregate match events per player id: goals, yellow/red cards, substitutions.
// Substitutions are attributed to the player coming OFF (subPlayerId), who is
// the starter actually shown on the pitch.
function buildPlayerEvents(events = []) {
  const map = new Map();

  const add = (pid, mutate) => {
    if (!pid) return;
    const entry = map.get(pid) || { goals: 0, yellow: 0, red: 0, sub: 0, subOnName: null };
    mutate(entry);
    map.set(pid, entry);
  };

  for (const event of events) {
    const code = event.typeCode;
    const t = (event.type || '').toLowerCase();

    if (code === 0 || (t === 'goal') || (/goal/.test(t) && !/(prevention|attempt|kick|miss|save|offside|concede|own)/.test(t))) {
      add(event.playerId, (e) => { e.goals += 1; });
    } else if (code === 4 || /yellow-red|second yellow/.test(t)) {
      add(event.playerId, (e) => { e.red += 1; });
    } else if (code === 3 || (/red/.test(t) && !/yellow/.test(t))) {
      add(event.playerId, (e) => { e.red += 1; });
    } else if (code === 2 || (/yellow/.test(t) && !/red/.test(t))) {
      add(event.playerId, (e) => { e.yellow += 1; });
    } else if (code === 5 || code === 65 || /substitut/.test(t)) {
      const offId = event.subPlayerId || event.playerId;
      const onName = parseSubOnName(event.description);
      add(offId, (e) => { e.sub += 1; if (onName) e.subOnName = onName; });
    }
  }
  return map;
}

function PlayerEventIcons({ ev }) {
  if (!ev || (!ev.goals && !ev.yellow && !ev.red && !ev.sub)) return null;
  return (
    <div className="absolute -bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-black/45 px-1 py-0.5 ring-1 ring-black/20 backdrop-blur-sm">
      {ev.goals > 0 && (
        <span className="flex items-center">
          <BallIcon className="h-3 w-3" />
          {ev.goals > 1 && <span className="ml-px text-[8px] font-black text-white">{ev.goals}</span>}
        </span>
      )}
      {ev.yellow > 0 && <span className="h-3 w-[7px] rounded-[1px] bg-amber-400 ring-1 ring-black/40" />}
      {ev.red > 0 && <span className="h-3 w-[7px] rounded-[1px] bg-rose-500 ring-1 ring-black/40" />}
      {ev.sub > 0 && (
        <span
          title={ev.subOnName ? `Subbed off · ${ev.subOnName} on` : 'Subbed off'}
          className="grid h-3.5 w-3.5 place-items-center rounded-full bg-rose-500 ring-1 ring-black/30"
        >
          <ArrowDown className="h-2.5 w-2.5 text-white" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

function parseFormation(tactics) {
  if (!tactics) return null;
  const nums = String(tactics)
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(Number)
    .filter((n) => n > 0);
  return nums.length ? nums : null;
}

// Returns { gk, rows: [[...defenders], [...mids], [...forwards]] }
function buildFormation(team) {
  const starters = team?.starters || [];
  if (!starters.length) return null;

  const gk = starters.find((p) => p.position === 'GK') || starters[0];
  const outfield = starters.filter((p) => p !== gk);

  const formation = parseFormation(team?.tactics);
  const sum = formation ? formation.reduce((a, b) => a + b, 0) : 0;

  if (formation && sum === outfield.length) {
    const rows = [];
    let idx = 0;
    for (const count of formation) {
      rows.push(outfield.slice(idx, idx + count));
      idx += count;
    }
    return { gk, rows };
  }

  // Fallback: group by reported position when the formation string doesn't line up
  const def = outfield.filter((p) => p.position === 'DF');
  const mid = outfield.filter((p) => p.position === 'MF');
  const fwd = outfield.filter((p) => p.position === 'FW');
  const other = outfield.filter((p) => !['DF', 'MF', 'FW'].includes(p.position));
  const rows = [def, mid.concat(other), fwd].filter((row) => row.length);
  return { gk, rows: rows.length ? rows : [outfield] };
}

// Build absolute-positioned nodes for one team on its half of the pitch.
// side === 'home' defends the left goal (GK far left); 'away' mirrors it.
function placeTeam(formation, side) {
  if (!formation) return [];
  const { gk, rows } = formation;
  const nodes = [];

  const gkX = side === 'home' ? 6 : 94;
  if (gk) nodes.push({ ...gk, x: gkX, y: 50, side });

  const start = side === 'home' ? 18 : 82;
  const end = side === 'home' ? 46 : 54;
  rows.forEach((row, rowIndex) => {
    const x = rows.length === 1 ? (start + end) / 2 : start + (rowIndex / (rows.length - 1)) * (end - start);
    row.forEach((player, playerIndex) => {
      const y = ((playerIndex + 1) / (row.length + 1)) * 100;
      nodes.push({ ...player, x, y, side });
    });
  });

  return nodes;
}

function PlayerToken({ node }) {
  const isHome = node.side === 'home';
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <div className="relative">
        <span
          className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-black shadow-lg ring-2 sm:h-9 sm:w-9 sm:text-xs ${
            isHome ? 'bg-white text-blue-900 ring-blue-400' : 'bg-slate-900 text-white ring-amber-300'
          }`}
        >
          {node.shirtNumber || '·'}
        </span>
        {node.captain && (
          <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-amber-400 text-[8px] font-black text-blue-950 ring-1 ring-white">
            C
          </span>
        )}
        <PlayerEventIcons ev={node.ev} />
      </div>
      <span className="mt-2 max-w-[72px] truncate rounded px-1 text-[9px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] sm:text-[10px]">
        {(node.name || '').split(' ').pop()}
      </span>
    </div>
  );
}

export function FormationPitch({ home, away, homeFallback, awayFallback, events = [] }) {
  const homeFormation = buildFormation(home);
  const awayFormation = buildFormation(away);

  if (!homeFormation && !awayFormation) return null;

  const playerEvents = buildPlayerEvents(events);
  const nodes = [...placeTeam(homeFormation, 'home'), ...placeTeam(awayFormation, 'away')].map((node) => ({
    ...node,
    ev: playerEvents.get(node.id) || null,
  }));

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-900/40 bg-emerald-800 shadow-[0_24px_60px_-30px_rgba(6,78,59,0.9)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Legend
          name={home?.name || teamName(homeFallback)}
          tactics={home?.tactics}
          dotClass="bg-white ring-blue-400"
        />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">Formations</span>
        <Legend
          name={away?.name || teamName(awayFallback)}
          tactics={away?.tactics}
          dotClass="bg-slate-900 ring-amber-300"
          align="right"
        />
      </div>

      <div className="overflow-x-auto px-3 pb-4">
        <div className="relative mx-auto aspect-[16/9] min-w-[620px] max-w-3xl">
          {/* Pitch surface with mowed stripes */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background:
                'repeating-linear-gradient(90deg, #15803d 0 9%, #16a34a 9% 18%)',
            }}
          />
          {/* Field markings */}
          <div className="absolute inset-3 rounded-md border-2 border-white/40" />
          <div className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-white/40" />
          <div className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />
          {/* Penalty boxes */}
          <div className="absolute left-3 top-1/2 h-[44%] w-[14%] -translate-y-1/2 border-2 border-l-0 border-white/40" />
          <div className="absolute right-3 top-1/2 h-[44%] w-[14%] -translate-y-1/2 border-2 border-r-0 border-white/40" />
          {/* Goal boxes */}
          <div className="absolute left-3 top-1/2 h-[22%] w-[6%] -translate-y-1/2 border-2 border-l-0 border-white/40" />
          <div className="absolute right-3 top-1/2 h-[22%] w-[6%] -translate-y-1/2 border-2 border-r-0 border-white/40" />

          {nodes.map((node, index) => (
            <PlayerToken key={`${node.side}-${node.id || node.shirtNumber || index}`} node={node} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-white/10 px-4 py-2.5 text-[11px] font-semibold text-white/90">
        <span className="flex items-center gap-1.5"><BallIcon className="h-3.5 w-3.5" /> Goal</span>
        <span className="flex items-center gap-1.5"><span className="h-3.5 w-2 rounded-[1px] bg-amber-400 ring-1 ring-black/40" /> Yellow</span>
        <span className="flex items-center gap-1.5"><span className="h-3.5 w-2 rounded-[1px] bg-rose-500 ring-1 ring-black/40" /> Red</span>
        <span className="flex items-center gap-1.5"><span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-rose-500"><ArrowDown className="h-2.5 w-2.5 text-white" aria-hidden="true" /></span> Subbed off</span>
        <span className="flex items-center gap-1.5"><span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-amber-400 text-[8px] font-black text-blue-950">C</span> Captain</span>
      </div>
    </section>
  );
}

function Legend({ name, tactics, dotClass, align }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className={`h-3 w-3 shrink-0 rounded-full ring-2 ${dotClass}`} />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{name}</p>
        {tactics && <p className="text-[11px] font-semibold text-white/70">{tactics}</p>}
      </div>
    </div>
  );
}
