import { Activity, ArrowLeftRight, Droplets } from 'lucide-react';

// Parse "9'", "45'+2'", 67, etc. for fallback half-boundary checks.
function parseMinuteParts(raw) {
  if (raw == null) return { minute: 0, stoppage: 0 };
  const m = String(raw).match(/(\d+)(?:\D+(\d+))?/);
  if (!m) return { minute: 0, stoppage: 0 };
  return { minute: Number(m[1]), stoppage: m[2] ? Number(m[2]) : 0 };
}

function minuteLabel(raw) {
  if (raw == null) return '';
  const s = String(raw).replace(/'+$/, '');
  return `${s}'`;
}

function categorize(type = '', typeCode) {
  const t = type.toLowerCase();
  const code = Number(typeCode);
  // Own goals checked first so "own goal" doesn't fall into the goal branch
  if (t.includes('own goal')) return 'owngoal';
  // typeCode 0 = scored goal from the FIFA feed; string fallback excludes
  // goal-adjacent events (attempts, kicks, saves, offsides, etc.)
  if (
    code === 0 ||
    t === 'goal' ||
    (t.includes('goal') && !/(attempt|kick|prevention|miss|save|offside|concede)/i.test(t) && !t.includes('own'))
  ) return 'goal';
  if (t.includes('yellow-red') || t.includes('second yellow') || code === 4) return 'yellowred';
  if ((t.includes('red') && !t.includes('yellow')) || code === 3) return 'red';
  if (t.includes('yellow') || code === 2) return 'yellow';
  if (t.includes('substitut') || code === 5 || code === 65) return 'sub';
  if (code === 12 || t.includes('attempt') || t.includes('shot')) return 'attempt';
  if (code === 16 || t.includes('corner')) return 'corner';
  if (code === 18 || t.includes('foul')) return 'foul';
  if (code === 57 || t.includes('prevention') || t.includes('save')) return 'save';
  if (code === 15 || t.includes('offside')) return 'offside';
  if (code === 1 || t.includes('assist')) return 'assist';
  if (code === 83 || t.includes('hydration') || t.includes('water break') || t.includes('cooling break')) return 'hydration';
  if (code === 7 || t.includes('start') || t.includes('kick off')) return 'period';
  if (code === 8 || code === 26 || t.includes('end time') || t.includes('match end')) return 'period';
  if (code === 78 || t.includes('resume')) return 'period';
  return 'event';
}

const CAT_LABEL = {
  goal: 'Goal',
  owngoal: 'Own goal',
  yellow: 'Yellow card',
  red: 'Red card',
  yellowred: 'Second yellow',
  sub: 'Substitution',
  attempt: 'Attempt',
  corner: 'Corner',
  foul: 'Foul',
  save: 'Save',
  offside: 'Offside',
  assist: 'Assist',
  hydration: 'Hydration break',
  period: 'Period',
  event: 'Event',
};

const HIDDEN_TYPES = new Set([79]);

const Ball = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" className="fill-white" />
    <path
      d="M12 6.5l3 2.2-1.15 3.55h-3.7L9 8.7 12 6.5zm-6 6.4l2.6.1 1.1 3.4-2 .9A7.6 7.6 0 016 12.9zm12 0a7.6 7.6 0 01-1.7 4.4l-2-.9 1.1-3.4 2.6-.1z"
      className="fill-blue-600"
    />
  </svg>
);

function Marker({ cat }) {
  switch (cat) {
    case 'goal':
    case 'owngoal':
      return (
        <span className={`grid h-6 w-6 place-items-center rounded-full ring-2 ring-white ${cat === 'owngoal' ? 'bg-rose-500' : 'bg-blue-500'}`}>
          <Ball className="h-3.5 w-3.5" />
        </span>
      );
    case 'sub':
      return (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-500 text-white ring-2 ring-white">
          <ArrowLeftRight className="h-3 w-3" aria-hidden="true" />
        </span>
      );
    case 'red':
      return <span className="block h-5 w-3.5 rounded-[3px] bg-rose-500 ring-2 ring-white" />;
    case 'yellowred':
      return (
        <span className="relative block h-5 w-4">
          <span className="absolute left-0 top-0 h-5 w-3 rotate-[-14deg] rounded-[3px] bg-amber-400 ring-1 ring-white" />
          <span className="absolute right-0 top-0 h-5 w-3 rotate-[14deg] rounded-[3px] bg-rose-500 ring-1 ring-white" />
        </span>
      );
    case 'yellow':
      return <span className="block h-5 w-3.5 rounded-[3px] bg-amber-400 ring-2 ring-white" />;
    case 'attempt':
      return (
        <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-sky-500 bg-white ring-2 ring-white">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
        </span>
      );
    case 'corner':
      return <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-500 text-[10px] font-black text-white ring-2 ring-white">C</span>;
    case 'foul':
      return <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-[10px] font-black text-white ring-2 ring-white">F</span>;
    case 'save':
      return <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-500 text-[10px] font-black text-white ring-2 ring-white">S</span>;
    case 'offside':
      return <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-600 text-[10px] font-black text-white ring-2 ring-white">O</span>;
    case 'assist':
      return <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-500 text-[10px] font-black text-white ring-2 ring-white">A</span>;
    case 'hydration':
      return (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-400 text-white ring-2 ring-white">
          <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      );
    case 'period':
      return <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-[10px] font-black text-slate-600 ring-2 ring-white">T</span>;
    default:
      return <span className="h-3 w-3 rounded-full bg-slate-400 ring-2 ring-white" />;
  }
}

function EventChip({ event, side, teamName }) {
  const cat = event._cat || categorize(event.type, event.typeCode);
  const isGoal = cat === 'goal' || cat === 'owngoal';
  const title = `${minuteLabel(event.minute)} · ${CAT_LABEL[cat] || event.type}${
    event.description ? ` — ${event.description}` : ''
  } · ${teamName}`;

  const minute = (
    <span className="text-[10px] font-bold tabular-nums text-slate-500">{minuteLabel(event.minute)}</span>
  );
  const score =
    isGoal && event.score ? (
      <span className="rounded bg-blue-600 px-1 text-[9px] font-black tabular-nums leading-tight text-white">
        {event.score.home}-{event.score.away}
      </span>
    ) : null;

  return (
    <div
      className="group flex flex-col items-center gap-0.5 transition-transform hover:-translate-y-0.5"
      title={title}
    >
      {side === 'away' && minute}
      <Marker cat={cat} />
      {side !== 'away' ? (
        <>
          {minute}
          {score}
        </>
      ) : (
        score
      )}
    </div>
  );
}

function Column({ event, homeName, awayName }) {
  const isHome = event.side === 'home';
  const isNeutral = !event.side;
  return (
    <div className="relative flex w-16 shrink-0 flex-col items-center">
      <div className="flex h-[72px] w-full flex-col items-center justify-end pb-1.5">
        {isHome && <EventChip event={event} side="home" teamName={homeName} />}
      </div>
      {isNeutral ? (
        <div className="relative z-10">
          <EventChip event={event} side="neutral" teamName="Match" />
        </div>
      ) : (
        <span className="relative z-10 h-2 w-2 rounded-full bg-white ring-2 ring-slate-300" />
      )}
      <div className="flex h-[72px] w-full flex-col items-center justify-start pt-1.5">
        {!isHome && !isNeutral && <EventChip event={event} side="away" teamName={awayName} />}
      </div>
    </div>
  );
}

function Bookend({ label }) {
  return (
    <div className="relative flex w-12 shrink-0 flex-col items-center justify-center">
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="relative mx-1 flex w-px shrink-0 flex-col items-center justify-center self-stretch">
      <span className="absolute inset-y-3 w-px bg-slate-200" />
      <span className="z-10 rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
        {label}
      </span>
    </div>
  );
}

function LegendItem({ swatch, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
      {swatch}
      {label}
    </span>
  );
}

const ROW_ACCENT = {
  home: 'border-l-blue-500',
  away: 'border-l-amber-400',
  neutral: 'border-l-slate-300',
};

function eventTeamName(event, homeName, awayName) {
  if (event.side === 'home') return homeName;
  if (event.side === 'away') return awayName;
  return 'Match';
}

function eventText(event) {
  return `${event.type || ''} ${event.description || ''}`.toLowerCase();
}

function isSecondPeriodStart(event) {
  const text = eventText(event);
  return Number(event.typeCode) === 7 && text.includes('start') && text.includes('second period');
}

function shouldInsertHalfTimeDivider(event) {
  if (isSecondPeriodStart(event)) return true;

  const { minute, stoppage } = parseMinuteParts(event.minute);
  return minute > 45 && stoppage === 0;
}

function EventRow({ event, homeName, awayName }) {
  const cat = event._cat || categorize(event.type, event.typeCode);
  const isGoal = cat === 'goal' || cat === 'owngoal';
  const side = event.side || 'neutral';
  const team = eventTeamName(event, homeName, awayName);
  const label = CAT_LABEL[cat] || event.type || 'Event';

  return (
    <li className={`grid grid-cols-[42px_auto_1fr_auto] items-start gap-3 rounded-lg border border-l-4 border-slate-200 bg-slate-50 px-3 py-2.5 ${ROW_ACCENT[side]}`}>
      <span className="pt-1 text-right text-xs font-black tabular-nums text-slate-500">{minuteLabel(event.minute) || '-'}</span>
      <Marker cat={cat} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-bold text-slate-950">{label}</span>
          <span className={`text-xs font-semibold ${event.side === 'home' ? 'text-blue-700' : event.side === 'away' ? 'text-amber-600' : 'text-slate-500'}`}>
            {team}
          </span>
        </div>
        {event.description && (
          <p className="mt-0.5 text-sm leading-snug text-slate-600">{event.description}</p>
        )}
      </div>
      {isGoal && event.score ? (
        <span className="rounded-md bg-blue-600 px-2 py-1 text-xs font-black tabular-nums text-white">
          {event.score.home}-{event.score.away}
        </span>
      ) : null}
    </li>
  );
}

export function MatchTimeline({ events = [], homeName, awayName }) {
  const displayEvents = events
    .filter((e) => !HIDDEN_TYPES.has(Number(e.typeCode)))
    .map((e, index) => ({ ...e, _cat: categorize(e.type, e.typeCode), _index: index }));

  // FIFA already sends timeline events chronologically. Sorting by absolute
  // minute would incorrectly move first-half stoppage time (45'+x) after the
  // second-half restart.
  const items = [];
  items.push({ kind: 'ko' });
  let htInserted = false;
  for (const e of displayEvents) {
    if (!htInserted && shouldInsertHalfTimeDivider(e)) {
      items.push({ kind: 'ht' });
      htInserted = true;
    }
    items.push({ kind: 'event', event: e });
  }
  items.push({ kind: 'ft' });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Activity className="h-5 w-5 text-blue-600" aria-hidden="true" />
        <h3 className="text-base font-bold text-slate-950">Timeline</h3>
        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          <LegendItem swatch={<span className="h-2.5 w-2.5 rounded-full bg-blue-500" />} label="Goal" />
          <LegendItem swatch={<span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-sky-500 bg-white"><span className="h-1.5 w-1.5 rounded-full bg-sky-500" /></span>} label="Attempt" />
          <LegendItem swatch={<span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-violet-500 text-[8px] font-black text-white">C</span>} label="Corner" />
          <LegendItem swatch={<span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-orange-500 text-[8px] font-black text-white">F</span>} label="Foul" />
          <LegendItem swatch={<span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-indigo-500 text-[8px] font-black text-white">S</span>} label="Save" />
          <LegendItem swatch={<span className="flex items-center gap-0.5"><span className="h-3 w-2 rounded-[2px] bg-amber-400" /><span className="h-3 w-2 rounded-[2px] bg-rose-500" /></span>} label="Card" />
          <LegendItem swatch={<span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-cyan-500 text-white"><ArrowLeftRight className="h-2.5 w-2.5" aria-hidden="true" /></span>} label="Sub" />
          <LegendItem swatch={<span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-600 text-[8px] font-black text-white">O</span>} label="Offside" />
          <LegendItem swatch={<span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-teal-500 text-[8px] font-black text-white">A</span>} label="Assist" />
          <LegendItem swatch={<span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-sky-400 text-white"><Droplets className="h-2.5 w-2.5" /></span>} label="Hydration" />
          <LegendItem swatch={<span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-200 text-[8px] font-black text-slate-600">T</span>} label="Period" />
        </div>
      </div>

      {displayEvents.length ? (
        <div className="space-y-4">
          <div className="flex items-stretch gap-3">
            <div className="flex shrink-0 flex-col justify-between py-3 text-[11px] font-bold">
              <span className="truncate text-blue-700">{homeName}</span>
              <span className="truncate text-amber-600">{awayName}</span>
            </div>

            <div className="relative min-w-0 flex-1 overflow-x-auto">
              <div className="relative mx-auto flex w-max items-stretch">
                {/* central spine spans the full rail width */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-100 via-slate-200 to-amber-100" />
                {items.map((item, i) => {
                  if (item.kind === 'ko') return <Bookend key="ko" label="KO" />;
                  if (item.kind === 'ft') return <Bookend key="ft" label="FT" />;
                  if (item.kind === 'ht') return <Divider key="ht" label="HT" />;
                  return (
                    <Column
                      key={item.event.eventId || `${item.event.minute}-${item.event.type}-${i}`}
                      event={item.event}
                      homeName={homeName}
                      awayName={awayName}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <ol className="grid gap-2">
            {[...displayEvents].reverse().map((event, index) => (
              <EventRow
                key={event.eventId || `${event.minute}-${event.type}-${index}`}
                event={event}
                homeName={homeName}
                awayName={awayName}
              />
            ))}
          </ol>
        </div>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          No timeline events recorded for this match.
        </p>
      )}
    </section>
  );
}
