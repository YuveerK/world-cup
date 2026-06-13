import {
  Circle,
  Document,
  Image,
  Line,
  Page,
  Path,
  StyleSheet,
  Text,
  View,
  Svg,
  Rect,
} from "@react-pdf/renderer";
import { roundPoints } from "@/lib/utils/number";
import { formatDate } from "@/lib/date/index";
import { teamName } from "@/features/matches/utils/matchFormatters";
import {
  displayStatus,
  hasMatchScore,
} from "@/features/matches/utils/matchStatus";

// ─── Design Tokens — Premium Light Mode ───────────────────────────────────────

const C = {
  // Canvas — soft blue-gray, not clinical white
  canvas: "#F2F5FA",
  canvasSub: "#EBF0F6",

  // Surfaces — pure white cards lift off the canvas
  white: "#FFFFFF",
  surfaceRaised: "#F8FAFD",

  // Borders — ultra-subtle definition
  border: "#DDE4ED",
  borderLight: "#EBF0F6",

  // Champion Gold — #1 only
  gold: "#C8860A",
  goldVivid: "#F0A020",
  goldWash: "#FFFBF0",
  goldBorder: "#EDD090",

  // Silver — #2
  silver: "#5E7080",
  silverVivid: "#8898B0",
  silverWash: "#EFF3F8",
  silverBorder: "#C0CDD8",

  // Bronze — #3
  bronze: "#966030",
  bronzeVivid: "#B87040",
  bronzeWash: "#FDF5EC",
  bronzeBorder: "#DDB880",

  // Success — points earned
  emerald: "#067A5C",
  emeraldVivid: "#10B981",
  emeraldWash: "#EDFAF5",
  emeraldBorder: "#A0DEC4",

  // Text hierarchy
  ink: "#0C1929",
  textPrimary: "#1A2B3D",
  textSecondary: "#4A5D72",
  textMuted: "#7E96AE",
  textDim: "#B8C8D8",

  // Category accent colors — vibrant on white
  htC: "#A86000",
  htBg: "#FFFBEB",
  ftC: "#1D50C0",
  ftBg: "#EFF6FF",
  clC: "#7030C0",
  clBg: "#F5F0FF",
  ouC: "#0A7898",
  ouBg: "#EEFAFF",
  wiC: "#B41020",
  wiBg: "#FFF0F2",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // ── Pages ──
  page: { fontFamily: "Helvetica", backgroundColor: C.canvas },
  coverPage: { fontFamily: "Helvetica", backgroundColor: C.white, padding: 0 },

  // ── Shared page header — white card, gold underline ──
  pageHeader: {
    backgroundColor: C.white,
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  pageHeaderEyebrow: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.gold,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  pageHeaderTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.ink },
  pageHeaderSub: { fontSize: 8.5, color: C.textMuted, marginTop: 3 },
  pageGoldLine: { height: 3, backgroundColor: C.goldVivid },
  pageGrayLine: { height: 1, backgroundColor: C.border },
  pageBody: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 14,
    flex: 1,
  },

  // ── Podium ──
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  podiumLane: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 4,
  },

  // ── Standings table ──
  standingsTH: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 4,
  },
  thLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.textMuted,
    letterSpacing: 1.2,
  },

  standingsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 8,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: C.borderLight,
    borderRightColor: C.borderLight,
    borderBottomColor: C.borderLight,
    marginBottom: 4,
    paddingVertical: 10,
  },

  tdRank: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
  },
  tdRankText: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  tdNameBlock: { flex: 1, paddingRight: 8 },
  tdName: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: C.textPrimary,
  },
  tdMeta: { fontSize: 6.5, color: C.textMuted, marginTop: 2 },

  progressTrack: {
    height: 2,
    backgroundColor: C.borderLight,
    borderRadius: 1,
    marginTop: 5,
  },
  progressFill: { height: 2, borderRadius: 1 },

  tdPtsBox: {
    width: 50,
    paddingVertical: 5,
    alignItems: "center",
    marginRight: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  tdPts: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  tdPtsLabel: {
    fontSize: 5.5,
    color: C.textMuted,
    letterSpacing: 0.8,
    marginTop: 1,
  },

  standingsCatGrid: {
    width: 210,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  standingsCatCol: { width: 40, alignItems: "center" },
  standingsCatLabel: {
    fontSize: 5.5,
    color: C.textDim,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  standingsCatValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },

  // ── Player page header ──
  playerHeader: {
    backgroundColor: C.white,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 0,
  },
  playerHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  playerRankBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  playerRankText: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  playerNameBlock: { flex: 1 },
  playerEyebrow: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.gold,
    marginBottom: 3,
    letterSpacing: 1.8,
  },
  playerName: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.ink },
  playerSubLine: { fontSize: 8, color: C.textMuted, marginTop: 3 },
  playerTotalBox: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: C.goldWash,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
  playerTotalLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: C.gold,
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  playerTotalValue: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: C.gold,
  },
  playerTotalSub: { fontSize: 6, color: C.textMuted, marginTop: 1 },

  catSummaryRow: {
    flexDirection: "row",
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  catBlock: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catBlockLast: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catBlockLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 3,
  },
  catBlockValue: { fontSize: 15, fontFamily: "Helvetica-Bold" },

  // ── Matchday card — white card, canvas-tinted header ──
  matchdayCard: {
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  matchdayHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.canvasSub,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  matchdayBody: { paddingHorizontal: 8, paddingBottom: 6, paddingTop: 2 },
  matchdayNum: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.goldVivid,
    marginRight: 10,
    letterSpacing: 1.8,
  },
  matchdayDate: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.textPrimary,
    flex: 1,
  },
  matchdayDayPts: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginRight: 10,
  },
  matchdayRunning: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.emerald,
  },

  // ── Match row — floating card inside matchday body ──
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: C.surfaceRaised,
    borderRadius: 7,
    marginTop: 4,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  matchRowScored: {
    backgroundColor: C.emeraldWash,
    borderColor: C.emeraldBorder,
  },

  matchFlag: { width: 22, height: 14, borderRadius: 2 },
  matchAbbr: {
    width: 26,
    height: 16,
    borderRadius: 2,
    backgroundColor: C.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  matchAbbrText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: C.textMuted,
  },
  matchTeamLine: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.textPrimary,
  },

  // Points pill — solid filled badge
  matchPts: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
    minWidth: 34,
    textAlign: "center",
  },
  matchPtsScored: { color: C.white, backgroundColor: C.emerald },
  matchPtsZero: { color: C.textMuted, backgroundColor: C.borderLight },

  // Category badges — light tinted chips
  matchCatRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  matchCatBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
    marginRight: 5,
  },

  // ── Stats strip footer — white card ──
  accuracyStrip: {
    flexDirection: "row",
    marginTop: 12,
    backgroundColor: C.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  accuracyItem: { flex: 1, alignItems: "center" },
  accuracyValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.ink },
  accuracyLabel: {
    fontSize: 6,
    color: C.textMuted,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  accuracyDivider: { width: 1, backgroundColor: C.border },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entryFor(player, matchId) {
  return (
    (player.match_points || []).find(
      (e) => String(e.match_id) === String(matchId),
    ) || null
  );
}

function isScoredMatchday(group) {
  return group.matches.some(
    (m) =>
      displayStatus(m) === "FINISHED" ||
      displayStatus(m) === "LIVE" ||
      hasMatchScore(m),
  );
}

function dayTotal(player, dayMatches) {
  return roundPoints(
    dayMatches.reduce(
      (sum, m) => sum + roundPoints(entryFor(player, m.id)?.match_total || 0),
      0,
    ),
  );
}

function rankBadgeColors(rank) {
  if (rank === 1) return { bg: C.goldWash, border: C.goldBorder, text: C.gold };
  if (rank === 2)
    return { bg: C.silverWash, border: C.silverBorder, text: C.silver };
  if (rank === 3)
    return { bg: C.bronzeWash, border: C.bronzeBorder, text: C.bronze };
  return { bg: C.canvas, border: C.border, text: C.textMuted };
}

function catConfig(key) {
  const map = {
    ht: { label: "HT EXACT", color: C.htC, bg: C.htBg },
    ft: { label: "FT EXACT", color: C.ftC, bg: C.ftBg },
    closest: { label: "CLOSEST", color: C.clC, bg: C.clBg },
    outcome: { label: "OUTCOME", color: C.ouC, bg: C.ouBg },
    winner: { label: "WINNER", color: C.wiC, bg: C.wiBg },
  };
  return map[key];
}

// ─── TeamCell ─────────────────────────────────────────────────────────────────

function TeamCell({ team, align = "left" }) {
  const name = teamName(team);
  const abbr = team?.abbreviation || "??";
  const isRight = align === "right";

  const flagImg = team?.flagUrl ? (
    <Image src={team.flagUrl} style={S.matchFlag} />
  ) : (
    <View style={S.matchAbbr}>
      <Text style={S.matchAbbrText}>{abbr}</Text>
    </View>
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        minWidth: 0,
        justifyContent: isRight ? "flex-end" : "flex-start",
      }}
    >
      {isRight ? (
        <>
          <Text style={[S.matchTeamLine, { flex: 1, textAlign: "right" }]}>
            {name}
          </Text>
          <View style={{ marginLeft: 6 }}>{flagImg}</View>
        </>
      ) : (
        <>
          <View style={{ marginRight: 6 }}>{flagImg}</View>
          <Text style={[S.matchTeamLine, { flex: 1 }]}>{name}</Text>
        </>
      )}
    </View>
  );
}

// ─── MatchRowPDF ──────────────────────────────────────────────────────────────

function MatchRowPDF({ match, entry }) {
  const pts        = roundPoints(entry?.match_total || 0);
  const scored     = pts > 0;
  const home       = match?.home;
  const away       = match?.away;
  const status     = displayStatus(match);
  const hasResult  = match?.home_score != null || entry?.result?.ft_home != null;
  const isPending  = !hasResult;

  const pred   = entry?.prediction;
  const res    = entry?.result;
  const htPred = pred?.ht_home != null ? `${pred.ht_home}-${pred.ht_away}` : "N/A";
  const ftPred = pred?.ft_home != null ? `${pred.ft_home}-${pred.ft_away}` : "N/A";
  const htRes  = res?.ht_home  != null ? `${res.ht_home}-${res.ht_away}`   : "N/A";
  const ftRes  = res?.ft_home  != null
    ? `${res.ft_home}-${res.ft_away}`
    : match?.home_score != null
      ? `${match.home_score}-${match.away_score}`
      : "N/A";

  const catBadges = [
    { key: "ht",      val: entry?.ht_pts      },
    { key: "ft",      val: entry?.ft_pts      },
    { key: "closest", val: entry?.closest_pts },
    { key: "outcome", val: entry?.outcome_pts },
  ].filter((c) => roundPoints(c.val || 0) > 0);

  const homeFlagEl = home?.flagUrl
    ? <Image src={home.flagUrl} style={S.matchFlag} />
    : <View style={S.matchAbbr}><Text style={S.matchAbbrText}>{home?.abbreviation || "??"}</Text></View>;

  const awayFlagEl = away?.flagUrl
    ? <Image src={away.flagUrl} style={S.matchFlag} />
    : <View style={S.matchAbbr}><Text style={S.matchAbbrText}>{away?.abbreviation || "??"}</Text></View>;

  const statusColor  = status === "LIVE" ? C.emeraldVivid : C.textMuted;
  const ptsBadgeBg   = scored ? "#2B5CE6" : C.borderLight;
  const ptsBadgeTx   = scored ? C.white   : C.textDim;
  const matchDateStr = match?.date ? formatDate(match.date) : "";

  return (
    <View wrap={false} style={{
      backgroundColor: C.white,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
      marginTop: 4,
    }}>
      {/* ── Top bar: Teams · Date · Status · Points ── */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7 }}>
        {/* Teams */}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          {homeFlagEl}
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.textPrimary, marginLeft: 6, marginRight: 5 }}>
            {teamName(home)}
          </Text>
          <Text style={{ fontSize: 7.5, color: C.textMuted, marginRight: 5 }}>vs</Text>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.textPrimary, marginRight: 6 }}>
            {teamName(away)}
          </Text>
          {awayFlagEl}
        </View>

        {/* Date */}
        {matchDateStr ? (
          <Text style={{ fontSize: 7.5, color: C.textMuted, marginRight: 8 }}>{matchDateStr}</Text>
        ) : null}

        {/* Status */}
        <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: statusColor, letterSpacing: 0.5, marginRight: 10 }}>
          {status}
        </Text>

        {/* Points badge */}
        <Text style={{
          fontSize: 11, fontFamily: "Helvetica-Bold",
          color: ptsBadgeTx, backgroundColor: ptsBadgeBg,
          paddingHorizontal: 9, paddingVertical: 3,
          borderRadius: 12, minWidth: 32, textAlign: "center",
        }}>
          {scored ? `+${pts}` : entry?.scored ? "0" : "–"}
        </Text>
      </View>

      {/* Thin separator */}
      <View style={{ height: 1, backgroundColor: C.borderLight }} />

      {/* ── Bottom: YOUR PICK · Arrow · RESULT · Category badges ── */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 6 }}>

        {/* YOUR PICK panel */}
        <View style={{
          flex: 1,
          backgroundColor: C.canvas,
          borderRadius: 7,
          paddingHorizontal: 10, paddingVertical: 6,
          borderWidth: 1,
          borderColor: C.borderLight,
        }}>
          <Text style={{ fontSize: 6, fontFamily: "Helvetica-Bold", color: C.textMuted, letterSpacing: 0.8, marginBottom: 6 }}>
            YOUR PICK
          </Text>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 6, color: C.textDim, marginBottom: 2 }}>HT</Text>
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: C.textSecondary }}>{htPred}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 6, color: C.textDim, marginBottom: 2 }}>FT</Text>
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: C.textSecondary }}>{ftPred}</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <View style={{ width: 28, alignItems: "center", justifyContent: "center" }}>
          <Svg width={12} height={8} viewBox="0 0 18 12">
            <Line x1={1} y1={6} x2={14} y2={6} stroke={C.textSecondary} strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M9,1 L15,6 L9,11" fill="none" stroke={C.textSecondary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>

        {/* RESULT panel */}
        <View style={{
          flex: 1,
          backgroundColor: scored ? C.emeraldWash : C.surfaceRaised,
          borderRadius: 7,
          paddingHorizontal: 10, paddingVertical: 6,
          borderWidth: 1,
          borderColor: scored ? C.emeraldBorder : C.borderLight,
        }}>
          <Text style={{ fontSize: 6, fontFamily: "Helvetica-Bold", color: scored ? C.emerald : C.textMuted, letterSpacing: 0.8, marginBottom: 6 }}>
            RESULT
          </Text>
          {isPending ? (
            <Text style={{ fontSize: 10, color: C.textMuted }}>Pending</Text>
          ) : (
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 6, color: C.textDim, marginBottom: 2 }}>HT</Text>
                <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: scored ? C.emerald : C.textSecondary }}>{htRes}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 6, color: C.textDim, marginBottom: 2 }}>FT</Text>
                <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: scored ? C.emerald : C.textSecondary }}>{ftRes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Category badges — fixed-width column so panels stay equal on all cards */}
        <View style={{ width: 74, marginLeft: 6, justifyContent: "center" }}>
          {catBadges.map(({ key, val }) => {
            const cfg = catConfig(key);
            return (
              <Text key={key} style={{
                fontSize: 7, fontFamily: "Helvetica-Bold",
                color: cfg.color, backgroundColor: cfg.bg,
                paddingHorizontal: 6, paddingVertical: 2.5,
                borderRadius: 4, marginBottom: 3,
              }}>
                {cfg.label} +{roundPoints(val)}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── MatchdayBlock ────────────────────────────────────────────────────────────

function MatchdayBlock({ player, matchday, mdIndex, runningTotal }) {
  const dTotal = dayTotal(player, matchday.matches);

  return (
    <View wrap={false}>
      {/* Lightweight section divider — no outer card, just a labeled rule */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingTop: 8, paddingBottom: 3,
        marginTop: mdIndex === 0 ? 0 : 4,
      }}>
        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.goldVivid, letterSpacing: 1.5, marginRight: 10 }}>
          MATCHDAY {mdIndex + 1}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        <Text style={{ fontSize: 8, color: C.textSecondary, marginLeft: 10 }}>
          {formatDate(matchday.date)}
        </Text>
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.textPrimary, marginLeft: 12, marginRight: 8 }}>
          +{dTotal}
        </Text>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.emerald }}>
          ↑ {roundPoints(runningTotal)} total
        </Text>
      </View>

      {matchday.matches.map((match) => (
        <MatchRowPDF
          key={match.id}
          match={match}
          entry={entryFor(player, match.id)}
        />
      ))}
    </View>
  );
}

// ─── Cover Page ───────────────────────────────────────────────────────────────

const STAR =
  "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z";

const HOST_FLAGS = [
  { src: "https://flagcdn.com/w320/ca.png", name: "CANADA" },
  { src: "https://flagcdn.com/w320/mx.png", name: "MEXICO" },
  { src: "https://flagcdn.com/w320/us.png", name: "USA" },
];

function CoverPage({ playerCount, matchdayCount, dateRange }) {
  return (
    <Page size="A4" style={S.coverPage}>
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Svg width={595} height={842} viewBox="0 0 595 842">
          <Rect
            x={38}
            y={248}
            width={519}
            height={346}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={1}
            opacity={0.022}
          />
          <Line
            x1={297}
            y1={248}
            x2={297}
            y2={594}
            stroke="#1D4ED8"
            strokeWidth={1}
            opacity={0.022}
          />
          <Circle
            cx={297}
            cy={421}
            r={62}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={1}
            opacity={0.022}
          />
          <Circle cx={297} cy={421} r={3.5} fill="#1D4ED8" opacity={0.035} />
          <Rect
            x={38}
            y={335}
            width={102}
            height={172}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={1}
            opacity={0.022}
          />
          <Rect
            x={38}
            y={375}
            width={44}
            height={92}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={1}
            opacity={0.022}
          />
          <Path
            d="M140,362 Q170,421 140,480"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={1}
            opacity={0.022}
          />
          <Circle cx={100} cy={421} r={2.5} fill="#1D4ED8" opacity={0.035} />
          <Rect
            x={455}
            y={335}
            width={102}
            height={172}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={1}
            opacity={0.022}
          />
          <Rect
            x={513}
            y={375}
            width={44}
            height={92}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={1}
            opacity={0.022}
          />
          <Path
            d="M455,362 Q425,421 455,480"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={1}
            opacity={0.022}
          />
          <Circle cx={495} cy={421} r={2.5} fill="#1D4ED8" opacity={0.035} />
          <Path
            d="M38,248  A12,12 0 0,1 50,260"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={0.8}
            opacity={0.025}
          />
          <Path
            d="M557,248 A12,12 0 0,0 545,260"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={0.8}
            opacity={0.025}
          />
          <Path
            d="M38,594  A12,12 0 0,0 50,582"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={0.8}
            opacity={0.025}
          />
          <Path
            d="M557,594 A12,12 0 0,1 545,582"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={0.8}
            opacity={0.025}
          />
        </Svg>
      </View>

      <View style={{ position: "absolute", top: -55, right: -55 }}>
        <Svg width={420} height={420} viewBox="0 0 420 420">
          <Circle
            cx={210}
            cy={210}
            r={200}
            fill="none"
            stroke={C.goldVivid}
            strokeWidth={1.5}
            opacity={0.14}
          />
          <Circle
            cx={210}
            cy={210}
            r={155}
            fill="none"
            stroke={C.goldVivid}
            strokeWidth={1}
            opacity={0.09}
          />
          <Circle
            cx={210}
            cy={210}
            r={108}
            fill="none"
            stroke={C.goldVivid}
            strokeWidth={0.7}
            opacity={0.07}
          />
          <Circle
            cx={210}
            cy={210}
            r={62}
            fill="none"
            stroke={C.goldVivid}
            strokeWidth={0.5}
            opacity={0.05}
          />
          <Line
            x1={210}
            y1={10}
            x2={210}
            y2={410}
            stroke={C.goldVivid}
            strokeWidth={0.7}
            opacity={0.09}
          />
          <Line
            x1={10}
            y1={210}
            x2={410}
            y2={210}
            stroke={C.goldVivid}
            strokeWidth={0.7}
            opacity={0.09}
          />
          <Line
            x1={60}
            y1={60}
            x2={360}
            y2={360}
            stroke={C.goldVivid}
            strokeWidth={0.5}
            opacity={0.06}
          />
          <Line
            x1={360}
            y1={60}
            x2={60}
            y2={360}
            stroke={C.goldVivid}
            strokeWidth={0.5}
            opacity={0.06}
          />
        </Svg>
      </View>

      <View style={{ position: "absolute", bottom: 80, left: -80 }}>
        <Svg width={260} height={260} viewBox="0 0 260 260">
          <Circle
            cx={130}
            cy={130}
            r={120}
            fill="none"
            stroke={C.goldVivid}
            strokeWidth={1}
            opacity={0.08}
          />
          <Circle
            cx={130}
            cy={130}
            r={82}
            fill="none"
            stroke={C.goldVivid}
            strokeWidth={0.7}
            opacity={0.06}
          />
          <Line
            x1={130}
            y1={10}
            x2={130}
            y2={250}
            stroke={C.goldVivid}
            strokeWidth={0.5}
            opacity={0.06}
          />
          <Line
            x1={10}
            y1={130}
            x2={250}
            y2={130}
            stroke={C.goldVivid}
            strokeWidth={0.5}
            opacity={0.06}
          />
        </Svg>
      </View>

      <View style={{ height: 5, backgroundColor: C.goldVivid }} />

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          paddingLeft: 48,
          paddingRight: 40,
          paddingTop: 46,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 10,
              fontFamily: "Helvetica-Bold",
              color: C.gold,
              letterSpacing: 5,
              marginBottom: 20,
            }}
          >
            FIFA
          </Text>
          <Text
            style={{
              fontSize: 66,
              fontFamily: "Helvetica-Bold",
              color: C.ink,
              lineHeight: 1,
            }}
          >
            WORLD
          </Text>
          <Text
            style={{
              fontSize: 66,
              fontFamily: "Helvetica-Bold",
              color: C.ink,
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            CUP
          </Text>
          <Text
            style={{
              fontSize: 100,
              fontFamily: "Helvetica-Bold",
              color: C.gold,
              lineHeight: 0.92,
              marginBottom: 26,
            }}
          >
            2026
          </Text>

          <View
            style={{
              width: 72,
              height: 4,
              backgroundColor: C.goldVivid,
              marginBottom: 24,
            }}
          />

          <View style={{ flexDirection: "row", marginBottom: 30 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Svg
                key={i}
                width={18}
                height={18}
                viewBox="0 0 24 24"
                style={{ marginRight: 5 }}
              >
                <Path d={STAR} fill={C.gold} />
              </Svg>
            ))}
          </View>

          <Text
            style={{
              fontSize: 9,
              fontFamily: "Helvetica-Bold",
              color: C.textMuted,
              letterSpacing: 2.5,
              marginBottom: 4,
            }}
          >
            CANADA · MEXICO
          </Text>
          <Text
            style={{
              fontSize: 9,
              fontFamily: "Helvetica-Bold",
              color: C.textMuted,
              letterSpacing: 2.5,
            }}
          >
            UNITED STATES
          </Text>
        </View>

        <View style={{ width: 130, alignItems: "flex-end", paddingTop: 4 }}>
          {HOST_FLAGS.map(({ src, name }, i) => (
            <View
              key={name}
              style={{ alignItems: "center", marginBottom: i < 2 ? 18 : 0 }}
            >
              <View
                style={{
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 5,
                  marginBottom: 6,
                }}
              >
                <Image src={src} style={{ width: 96, height: 64 }} />
              </View>
              <Text
                style={{
                  fontSize: 7,
                  fontFamily: "Helvetica-Bold",
                  color: C.textMuted,
                  letterSpacing: 2,
                }}
              >
                {name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={{
          backgroundColor: C.goldVivid,
          paddingHorizontal: 48,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Helvetica-Bold",
              color: C.white,
              letterSpacing: 2.5,
              marginBottom: 3,
            }}
          >
            PREDICTION LEAGUE
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: C.white,
              opacity: 0.75,
              letterSpacing: 1.5,
            }}
          >
            OFFICIAL MATCHDAY PROGRAMME · FIFA WORLD CUP 2026
          </Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          {[0, 1, 2].map((i) => (
            <Svg
              key={i}
              width={14}
              height={14}
              viewBox="0 0 24 24"
              style={{ marginLeft: 4 }}
            >
              <Path d={STAR} fill="rgba(255,255,255,0.35)" />
            </Svg>
          ))}
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: 48,
          paddingTop: 18,
          paddingBottom: 20,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            flex: 1,
            borderRightWidth: 1,
            borderRightColor: C.border,
            paddingRight: 20,
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontFamily: "Helvetica-Bold",
              color: C.ink,
              lineHeight: 1,
            }}
          >
            {playerCount}
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: C.textMuted,
              letterSpacing: 2,
              marginTop: 4,
            }}
          >
            PLAYERS
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            borderRightWidth: 1,
            borderRightColor: C.border,
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontFamily: "Helvetica-Bold",
              color: C.ink,
              lineHeight: 1,
            }}
          >
            {matchdayCount}
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: C.textMuted,
              letterSpacing: 2,
              marginTop: 4,
            }}
          >
            MATCHDAYS PLAYED
          </Text>
        </View>
        <View style={{ flex: 2, paddingLeft: 20 }}>
          {dateRange ? (
            <>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Helvetica-Bold",
                  color: C.ink,
                  lineHeight: 1,
                }}
              >
                {dateRange}
              </Text>
              <Text
                style={{
                  fontSize: 8,
                  color: C.textMuted,
                  letterSpacing: 2,
                  marginTop: 4,
                }}
              >
                TOURNAMENT DATES
              </Text>
            </>
          ) : (
            <Text
              style={{ fontSize: 10, color: C.textMuted, letterSpacing: 1 }}
            >
              IN PROGRESS
            </Text>
          )}
        </View>
      </View>

      <View style={{ height: 5, backgroundColor: C.goldVivid }} />
    </Page>
  );
}

// ─── Standings Page ───────────────────────────────────────────────────────────

function StandingsPage({ rows }) {
  const sorted = [...rows].sort(
    (a, b) =>
      (a.selectedRank || a.rank) - (b.selectedRank || b.rank) ||
      a.username.localeCompare(b.username),
  );
  const maxTotal = Math.max(...sorted.map((r) => roundPoints(r.total || 0)), 1);
  const podium = sorted.slice(0, 3);

  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <Page size="A4" style={S.page}>
      <View style={{ position: "absolute", top: -28, right: -28 }}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          <Circle
            cx={90}
            cy={90}
            r={80}
            fill="none"
            stroke={C.goldVivid}
            strokeWidth={0.8}
            opacity={0.1}
          />
          <Circle
            cx={90}
            cy={90}
            r={50}
            fill="none"
            stroke={C.goldVivid}
            strokeWidth={0.6}
            opacity={0.07}
          />
          <Line
            x1={90}
            y1={10}
            x2={90}
            y2={170}
            stroke={C.goldVivid}
            strokeWidth={0.5}
            opacity={0.07}
          />
          <Line
            x1={10}
            y1={90}
            x2={170}
            y2={90}
            stroke={C.goldVivid}
            strokeWidth={0.5}
            opacity={0.07}
          />
        </Svg>
      </View>

      <View style={S.pageHeader}>
        <Text style={S.pageHeaderEyebrow}>
          FIFA WORLD CUP 2026 · PREDICTION LEAGUE
        </Text>
        <Text style={S.pageHeaderTitle}>Championship Standings</Text>
        <Text style={S.pageHeaderSub}>
          Ranked by total cumulative points · All matchdays included
        </Text>
      </View>
      <View style={S.pageGoldLine} />

      <View style={S.pageBody}>
        {/* ── Podium ── */}
        <View style={S.podiumContainer}>
          {podiumOrder.map((row) => {
            const rank = row.selectedRank || row.rank;
            const platformH = rank === 1 ? 88 : rank === 2 ? 62 : 44;
            const accentColor =
              rank === 1 ? C.goldVivid : rank === 2 ? C.silverVivid : C.bronzeVivid;
            const ptsColor =
              rank === 1 ? C.gold : rank === 2 ? C.silver : C.bronze;

            return (
              <View key={row.username} style={S.podiumLane} wrap={false}>
                {/* Crown above #1 */}
                {rank === 1 && (
                  <View style={{ alignItems: "center", marginBottom: 5 }}>
                    <Svg width={16} height={11} viewBox="0 0 24 16">
                      <Path
                        d="M2,14 L2,6 L7,11 L12,1 L17,11 L22,6 L22,14 Z"
                        fill={C.goldVivid}
                      />
                    </Svg>
                  </View>
                )}

                {/* Avatar circle */}
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: accentColor,
                  alignItems: "center", justifyContent: "center",
                  marginBottom: 7,
                }}>
                  <Text style={{ fontSize: 17, fontFamily: "Helvetica-Bold", color: C.white }}>
                    {row.username.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Name */}
                <Text style={{
                  fontSize: 10, fontFamily: "Helvetica-Bold",
                  color: C.textPrimary, textAlign: "center", marginBottom: 3,
                }}>
                  {row.username}
                </Text>

                {/* Points */}
                <Text style={{
                  fontSize: 20, fontFamily: "Helvetica-Bold",
                  color: ptsColor, textAlign: "center", lineHeight: 1, marginBottom: 2,
                }}>
                  {roundPoints(row.total)}
                </Text>

                {/* Picks count */}
                <Text style={{
                  fontSize: 7, color: C.textMuted, textAlign: "center", marginBottom: 10,
                }}>
                  {row.match_points?.length || 0} picks
                </Text>

                {/* Platform block */}
                <View style={{
                  width: "100%", height: platformH,
                  backgroundColor: accentColor,
                  borderTopLeftRadius: 6, borderTopRightRadius: 6,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{
                    fontSize: 36, fontFamily: "Helvetica-Bold",
                    color: C.white, lineHeight: 1,
                  }}>
                    {rank}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Table ── */}
        {sorted.map((row) => {
          const rank = row.selectedRank || row.rank;
          const total = roundPoints(row.total || 0);
          const accentColor =
            rank === 1 ? C.goldVivid : rank === 2 ? C.silverVivid : rank === 3 ? C.bronzeVivid : C.borderLight;
          const badgeBg =
            rank === 1 ? C.goldVivid : rank === 2 ? C.silverVivid : rank === 3 ? C.bronzeVivid : C.canvas;
          const badgeTx = rank <= 3 ? C.white : C.textMuted;
          const ptsColor =
            rank === 1 ? C.gold : rank === 2 ? C.silver : rank === 3 ? C.bronze : C.textPrimary;

          return (
            <View key={row.username} style={S.standingsRow} wrap={false}>
              {/* Left accent bar */}
              <View style={{
                width: 4, alignSelf: "stretch",
                backgroundColor: accentColor,
                borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
                marginRight: 12,
              }} />

              {/* Rank circle */}
              <View style={{
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: badgeBg,
                alignItems: "center", justifyContent: "center",
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 10.5, fontFamily: "Helvetica-Bold", color: badgeTx }}>
                  {rank}
                </Text>
              </View>

              {/* Name + meta */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.textPrimary }}>
                  {row.username}
                </Text>
                <Text style={{ fontSize: 7, color: C.textMuted, marginTop: 2 }}>
                  {row.match_points?.length || 0} predictions · Winner: {row.winner || "—"}
                </Text>
              </View>

              {/* Points */}
              <View style={{ alignItems: "flex-end", paddingRight: 6 }}>
                <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: ptsColor, lineHeight: 1 }}>
                  {total}
                </Text>
                <Text style={{ fontSize: 5.5, fontFamily: "Helvetica-Bold", color: C.textMuted, letterSpacing: 1.5, marginTop: 2 }}>
                  POINTS
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Page>
  );
}

// ─── Player Page ──────────────────────────────────────────────────────────────

function PlayerPage({ player, scoredMatchdays, allMatchdays }) {
  const rank = player.selectedRank || player.rank;

  let running = 0;
  const runningTotals = scoredMatchdays.map((md) => {
    running = roundPoints(running + dayTotal(player, md.matches));
    return running;
  });

  const allEntries = player.match_points || [];
  const scoredEntries = allEntries.filter((e) => e.scored);
  const scored = scoredEntries.length;
  const pointsEarned = scoredEntries.filter(
    (e) => roundPoints(e.match_total || 0) > 0,
  ).length;
  const accuracy = scored ? Math.round((pointsEarned / scored) * 100) : 0;
  const exactFT = allEntries.filter((e) => (e.ft_pts || 0) > 0).length;
  const exactHT = allEntries.filter((e) => (e.ht_pts || 0) > 0).length;
  const bestDay = Math.max(...(player.dayTotals || [0]), 0);

  const cats = [
    { label: "HT EXACT", val: player.ht_pts, key: "ht" },
    { label: "FT EXACT", val: player.ft_pts, key: "ft" },
    { label: "CLOSEST", val: player.closest_pts, key: "closest" },
    { label: "OUTCOME", val: player.outcome_pts, key: "outcome" },
    { label: "W.CUP PICK", val: player.winner_pts, key: "winner" },
  ];

  return (
    <Page size="A4" style={S.page} break>
      <View style={S.playerHeader}>
        <View style={S.playerHeaderInner}>
          <View
            style={[
              S.playerRankBadge,
              {
                backgroundColor:
                  rank === 1
                    ? C.goldVivid
                    : rank === 2
                      ? C.silverVivid
                      : rank === 3
                        ? C.bronzeVivid
                        : C.canvas,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Helvetica-Bold",
                color: rank <= 3 ? C.white : C.textMuted,
              }}
            >
              #{rank}
            </Text>
          </View>

          <View style={S.playerNameBlock}>
            <Text style={S.playerEyebrow}>
              PLAYER ANALYSIS · WORLD CUP 2026
            </Text>
            <Text style={S.playerName}>{player.username}</Text>
            <Text style={S.playerSubLine}>
              {allEntries.length} predictions · Winner pick:{" "}
              {player.winner || "Not set"}
            </Text>
          </View>

          <View style={S.playerTotalBox}>
            <Text style={S.playerTotalLabel}>TOTAL PTS</Text>
            <Text style={S.playerTotalValue}>{roundPoints(player.total)}</Text>
            <Text style={S.playerTotalSub}>Rank #{rank}</Text>
          </View>
        </View>

        <View style={S.catSummaryRow}>
          {cats.map((cat, i) => {
            const cfg = catConfig(cat.key);
            const isLast = i === cats.length - 1;
            return (
              <View key={cat.key} style={isLast ? S.catBlockLast : S.catBlock}>
                <Text style={S.catBlockLabel}>{cat.label}</Text>
                <Text style={[S.catBlockValue, { color: cfg.color }]}>
                  {roundPoints(cat.val || 0)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={S.pageGoldLine} />

      <View style={S.pageBody}>
        {scoredMatchdays.map((md, j) => {
          const mdIdx = allMatchdays.indexOf(md);
          return (
            <MatchdayBlock
              key={md.key}
              player={player}
              matchday={md}
              mdIndex={mdIdx}
              runningTotal={runningTotals[j]}
            />
          );
        })}

        <View style={S.accuracyStrip} wrap={false}>
          {[
            { label: "ACCURACY", value: `${accuracy}%` },
            { label: "FT EXACT", value: exactFT },
            { label: "HT EXACT", value: exactHT },
            { label: "BEST DAY", value: `+${bestDay}` },
            { label: "PREDICTIONS", value: allEntries.length },
            { label: "SCORED", value: scored },
          ].map(({ label, value }, i, arr) => (
            <View
              key={label}
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <View style={S.accuracyItem}>
                <Text style={S.accuracyValue}>{value}</Text>
                <Text style={S.accuracyLabel}>{label}</Text>
              </View>
              {i < arr.length - 1 && <View style={S.accuracyDivider} />}
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}

// ─── Document export ──────────────────────────────────────────────────────────

export function MatchdayReportPDF({ rows, matchdays, fixturesById }) {
  const scoredMatchdays = matchdays.filter(isScoredMatchday);
  const sorted = [...rows].sort(
    (a, b) =>
      (a.selectedRank || a.rank) - (b.selectedRank || b.rank) ||
      a.username.localeCompare(b.username),
  );

  const firstDate = scoredMatchdays[0]?.date
    ? formatDate(scoredMatchdays[0].date)
    : null;
  const lastDate = scoredMatchdays[scoredMatchdays.length - 1]?.date
    ? formatDate(scoredMatchdays[scoredMatchdays.length - 1].date)
    : null;
  const dateRange =
    firstDate && lastDate && firstDate !== lastDate
      ? `${firstDate} – ${lastDate}`
      : firstDate || null;

  return (
    <Document
      title="WC2026 Prediction League Programme"
      author="Prediction League"
    >
      <CoverPage
        playerCount={rows.length}
        matchdayCount={scoredMatchdays.length}
        dateRange={dateRange}
      />
      <StandingsPage rows={sorted} />
      {sorted.map((player) => (
        <PlayerPage
          key={player.username}
          player={player}
          scoredMatchdays={scoredMatchdays}
          allMatchdays={matchdays}
        />
      ))}
    </Document>
  );
}
