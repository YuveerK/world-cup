import { BracketMatch } from './BracketMatch';

// ── Layout constants ───────────────────────────────────────────────────────────
const SLOT = 88;      // px per R32 bracket slot (vertical spacing unit)
const TOTAL_H = 8 * SLOT; // 704px — height of every round column
const MATCH_H = 70;   // approximate rendered height of BracketMatch
const COL_W = 130;    // width of a round column
const GAP_W = 36;     // width of the connector SVG gap between columns

// Vertical centre of a match at the given (possibly fractional) position
function cy(pos) {
  return pos * SLOT + SLOT / 2;
}

// Fixed bracket positions (slot units, 0-indexed from the top):
//   R32 left: slots 1-8  → positions 0-7
//   R16 left: slots 1-4  → positions 0.5, 2.5, 4.5, 6.5
//   QF  left: slots 1-2  → positions 1.5, 5.5
//   SF  left: slot  1    → position  3.5
//   Final              → position  3.5  (centre of bracket)
//   Third place        → position  5.5  (below final)
//   Mirror for right side

const L_CONN = [
  // R32 → R16 (4 pairs)
  [{ c: [0, 1], p: 0.5 }, { c: [2, 3], p: 2.5 }, { c: [4, 5], p: 4.5 }, { c: [6, 7], p: 6.5 }],
  // R16 → QF (2 pairs)
  [{ c: [0.5, 2.5], p: 1.5 }, { c: [4.5, 6.5], p: 5.5 }],
  // QF → SF (1 pair)
  [{ c: [1.5, 5.5], p: 3.5 }],
  // SF → Final (straight line — same y)
  [{ c: [3.5], p: 3.5 }],
];

const R_CONN = [
  // Final → SF right (straight line)
  [{ c: [3.5], p: 3.5 }],
  // SF right ← QF right
  [{ c: [1.5, 5.5], p: 3.5 }],
  // QF right ← R16 right
  [{ c: [0.5, 2.5], p: 1.5 }, { c: [4.5, 6.5], p: 5.5 }],
  // R16 right ← R32 right
  [{ c: [0, 1], p: 0.5 }, { c: [2, 3], p: 2.5 }, { c: [4, 5], p: 4.5 }, { c: [6, 7], p: 6.5 }],
];

// ── SVG connector between two adjacent round columns ─────────────────────────
function Connector({ pairs, direction }) {
  const mid = GAP_W / 2;
  const stroke = '#cbd5e1';
  const sw = 1.5;

  return (
    <svg
      width={GAP_W}
      height={TOTAL_H}
      className="shrink-0"
      style={{ overflow: 'visible', display: 'block' }}
    >
      {pairs.map(({ c, p }, i) => {
        const yP = cy(p);

        // Single child: draw a straight horizontal line
        if (c.length === 1) {
          const y1 = cy(c[0]);
          const x1 = direction === 'left' ? 0 : GAP_W;
          const x2 = direction === 'left' ? GAP_W : 0;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={yP} stroke={stroke} strokeWidth={sw} />;
        }

        const y1 = cy(c[0]);
        const y2 = cy(c[1]);

        // Left direction: children are on the left, parent is on the right
        if (direction === 'left') {
          return (
            <g key={i}>
              <line x1={0} y1={y1} x2={mid} y2={y1} stroke={stroke} strokeWidth={sw} />
              <line x1={0} y1={y2} x2={mid} y2={y2} stroke={stroke} strokeWidth={sw} />
              <line x1={mid} y1={y1} x2={mid} y2={y2} stroke={stroke} strokeWidth={sw} />
              <line x1={mid} y1={yP} x2={GAP_W} y2={yP} stroke={stroke} strokeWidth={sw} />
            </g>
          );
        }

        // Right direction: parent is on the left, children are on the right
        return (
          <g key={i}>
            <line x1={GAP_W} y1={y1} x2={mid} y2={y1} stroke={stroke} strokeWidth={sw} />
            <line x1={GAP_W} y1={y2} x2={mid} y2={y2} stroke={stroke} strokeWidth={sw} />
            <line x1={mid} y1={y1} x2={mid} y2={y2} stroke={stroke} strokeWidth={sw} />
            <line x1={mid} y1={yP} x2={0} y2={yP} stroke={stroke} strokeWidth={sw} />
          </g>
        );
      })}
    </svg>
  );
}

// ── A single round column: matches absolutely positioned ─────────────────────
function RoundColumn({ matches, positions }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: COL_W, height: TOTAL_H }}
    >
      {(matches || []).map((match, i) => (
        <div
          key={match?.id ?? i}
          className="absolute left-0 right-0"
          style={{ top: cy(positions[i]) - MATCH_H / 2 }}
        >
          <BracketMatch match={match} />
        </div>
      ))}
    </div>
  );
}

// ── Center column: Final + third-place ───────────────────────────────────────
const FINAL_POS = 3.5;
const THIRD_POS = 5.5;
const INLINE_LABEL_H = 18;

function CenterColumn({ finalMatch, thirdMatch }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: COL_W, height: TOTAL_H }}
    >
      {/* "Final" inline label */}
      <div
        className="absolute left-0 right-0 text-center text-[10px] font-semibold text-slate-600"
        style={{ top: cy(FINAL_POS) - MATCH_H / 2 - INLINE_LABEL_H }}
      >
        Final
      </div>
      <div
        className="absolute left-0 right-0"
        style={{ top: cy(FINAL_POS) - MATCH_H / 2 }}
      >
        <BracketMatch match={finalMatch} />
      </div>

      {/* "Play-off for third place" inline label */}
      <div
        className="absolute left-0 right-0 text-center text-[9px] font-semibold text-slate-500"
        style={{ top: cy(THIRD_POS) - MATCH_H / 2 - INLINE_LABEL_H }}
      >
        Play-off for third place
      </div>
      <div
        className="absolute left-0 right-0"
        style={{ top: cy(THIRD_POS) - MATCH_H / 2 }}
      >
        <BracketMatch match={thirdMatch} />
      </div>
    </div>
  );
}

// ── Organise raw API round data into the nine bracket columns ────────────────
function organizeBracket(rounds) {
  const byRound = new Map((rounds || []).map((r) => [r.key, r.matches || []]));

  const r32 = byRound.get('round-of-32') || [];
  const r16 = byRound.get('round-of-16') || [];
  const qf  = byRound.get('quarter-finals') || [];
  const sf  = byRound.get('semi-finals') || [];
  const fin  = byRound.get('final') || [];
  const third = byRound.get('third-place') || [];

  return {
    leftR32:  r32.filter((m) => m.bracketSlot <= 8).sort((a, b) => a.bracketSlot - b.bracketSlot),
    leftR16:  r16.filter((m) => m.bracketSlot <= 4).sort((a, b) => a.bracketSlot - b.bracketSlot),
    leftQF:   qf.filter((m)  => m.bracketSlot <= 2).sort((a, b) => a.bracketSlot - b.bracketSlot),
    leftSF:   sf.filter((m)  => m.bracketSlot === 1),
    finalMatch:  fin[0] || null,
    thirdMatch:  third[0] || null,
    rightSF:  sf.filter((m)  => m.bracketSlot === 2),
    rightQF:  qf.filter((m)  => m.bracketSlot >= 3).sort((a, b) => a.bracketSlot - b.bracketSlot),
    rightR16: r16.filter((m) => m.bracketSlot >= 5).sort((a, b) => a.bracketSlot - b.bracketSlot),
    rightR32: r32.filter((m) => m.bracketSlot >= 9).sort((a, b) => a.bracketSlot - b.bracketSlot),
  };
}

// ── Column header row ────────────────────────────────────────────────────────
function BracketHeaderRow() {
  const cols  = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', '', 'Semi-final', 'Quarter-final', 'Round of 16', 'Round of 32'];

  return (
    <div className="flex items-end pb-3" style={{ minWidth: 'max-content' }}>
      {cols.map((label, i) => (
        <div key={i} className="flex shrink-0 items-end">
          <div
            className="shrink-0 text-center text-xs font-medium text-slate-500"
            style={{ width: COL_W }}
          >
            {label}
          </div>
          {/* Insert a gap spacer after every column except the last */}
          {i < cols.length - 1 && <div className="shrink-0" style={{ width: GAP_W }} />}
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function KnockoutBracket({ rounds }) {
  const {
    leftR32, leftR16, leftQF, leftSF,
    finalMatch, thirdMatch,
    rightSF, rightQF, rightR16, rightR32,
  } = organizeBracket(rounds);

  const L_R32_POS = [0, 1, 2, 3, 4, 5, 6, 7];
  const L_R16_POS = [0.5, 2.5, 4.5, 6.5];
  const L_QF_POS  = [1.5, 5.5];
  const L_SF_POS  = [3.5];
  const R_SF_POS  = [3.5];
  const R_QF_POS  = [1.5, 5.5];
  const R_R16_POS = [0.5, 2.5, 4.5, 6.5];
  const R_R32_POS = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="overflow-x-auto pb-2">
      <div style={{ minWidth: 'max-content' }}>
        {/* Column header labels */}
        <BracketHeaderRow />

        {/* Bracket body */}
        <div className="flex items-start">
          {/* ── Left half ── */}
          <RoundColumn matches={leftR32} positions={L_R32_POS} />
          <Connector pairs={L_CONN[0]} direction="left" />

          <RoundColumn matches={leftR16} positions={L_R16_POS} />
          <Connector pairs={L_CONN[1]} direction="left" />

          <RoundColumn matches={leftQF} positions={L_QF_POS} />
          <Connector pairs={L_CONN[2]} direction="left" />

          <RoundColumn matches={leftSF} positions={L_SF_POS} />
          <Connector pairs={L_CONN[3]} direction="left" />

          {/* ── Center ── */}
          <CenterColumn finalMatch={finalMatch} thirdMatch={thirdMatch} />

          {/* ── Right half ── */}
          <Connector pairs={R_CONN[0]} direction="right" />
          <RoundColumn matches={rightSF} positions={R_SF_POS} />

          <Connector pairs={R_CONN[1]} direction="right" />
          <RoundColumn matches={rightQF} positions={R_QF_POS} />

          <Connector pairs={R_CONN[2]} direction="right" />
          <RoundColumn matches={rightR16} positions={R_R16_POS} />

          <Connector pairs={R_CONN[3]} direction="right" />
          <RoundColumn matches={rightR32} positions={R_R32_POS} />
        </div>
      </div>
    </div>
  );
}
