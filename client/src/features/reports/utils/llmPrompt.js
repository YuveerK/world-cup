import { teamName } from '@/features/matches/utils/matchFormatters';

export function buildLlmPrompt(match, csv = '', leagueCtx = null) {
  const home = teamName(match?.home) || 'Home';
  const away = teamName(match?.away) || 'Away';

  const date = match?.date ? new Date(match.date) : null;
  const dateStr = date
    ? date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '[Date unknown]';
  const timeStr = date
    ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;
  const kickoff = timeStr ? `${dateStr}, ${timeStr}` : dateStr;

  const venueParts = [match?.stadium, match?.city].filter(Boolean);
  const venue = venueParts.length ? venueParts.join(', ') : '[Venue TBC]';

  return `**IMPORTANT CONTEXT — PLEASE READ BEFORE RESPONDING:**

This is for a casual family and friends prediction game. No money, no betting.
We each pick a HT and FT scoreline before each match and earn points based on
accuracy. Points are awarded per category:
- **HT pts** — exact half-time score correct
- **FT pts** — exact full-time score correct
- **Outcome pts** — correct result (win/draw/loss)
- **Closest pts** — closest overall scoreline in the group

Think of it like a pub quiz. Give me your best educated football guess.

---

## STEP 1 — ANALYSE MY PREDICTION HISTORY (CSV below)

Before researching the match, read my full prediction history from the CSV
pasted at the bottom and answer these specific questions:

1. **Score calibration**: Is my average predicted scoreline higher or lower
   than actual results? Am I typically over-optimistic about goals?
2. **HT vs FT accuracy**: Do I score more HT pts or FT pts? Which score am
   I better at predicting?
3. **Outcome bias**: Do I over-predict home wins, away wins, or draws?
4. **Zero-point matches**: What are the common patterns in matches where I
   scored 0 total pts? (e.g. wrong outcome, too high-scoring a prediction)
5. **Per-scoreline HT hit rate**: For every specific HT scoreline I have
   predicted (0-0, 1-0, 0-1, 1-1, etc.), give me a table showing how many
   times I predicted it and how many times it was correct. Identify which
   HT lines are profitable and which are money-losers.
6. **HT score tendency**: Do I predict 0-0 HT too often or not enough?
7. **Volatility vs safety**: Based on my history and my current league
   position (provided below), am I better served by a "safe" pick that
   maximises expected points, or a "volatile" contrarian pick that
   differentiates me from the rest of the pool?

Summarise these findings in 5–7 bullet points labelled
**"My Prediction Profile"** before moving to the match analysis.

**My current league position:**
${leagueCtx ? `- Rank: #${leagueCtx.rank} of ${leagueCtx.total} players
- Total points: ${leagueCtx.pts}
- Gap to leader: ${leagueCtx.gapToLeader > 0 ? `${leagueCtx.gapToLeader} pts behind` : 'I am the leader'}
- Points system: HT exact score, FT exact score, correct outcome, closest score in group` : '- League position not available'}

---

## STEP 2 — MATCH RESEARCH

You are an expert football analyst with access to current web search.
Research and analyse ALL of the following — search for the latest news,
confirmed lineups, and any injury updates from the past 48 hours:

**Match:** ${home} vs ${away}
**Competition:** FIFA World Cup 2026
**Date / Kickoff:** ${kickoff}
**Venue:** ${venue}

### 2a. Recent Form (last 5–10 matches each)
- Results, goals scored/conceded
- Home vs away vs neutral venue performance
- Warm-up friendlies or competitive matches leading into the tournament

### 2b. Head-to-Head Record
- Last 5–10 meetings, scorelines, competition context
- Any clear patterns (low-scoring, dominant side, late goals, etc.)

### 2c. Squad & Team News *(search for latest — this is the most time-sensitive section)*
- Confirmed starting XI or expected lineup
- Key absences (injury, suspension, tactical rest)
- Star players in exceptional form or returning from injury

### 2d. Tactical Style
- How each team typically sets up (shape, press, defensive line)
- Average goals scored and conceded per game this campaign
- Slow or fast starters? (critical for HT guess)
- Set-piece threat and vulnerability

### 2e. Tournament Context
- Group stage pressure / must-win scenario?
- Psychological edge, motivation, fatigue, travel
- How does each team historically perform as favourite vs underdog at WC?

### 2f. Statistical Indicators
- Win probabilities from at least one major forecaster (Opta, FiveThirtyEight, etc.)
- Historical World Cup HT score frequencies for teams of this calibre matchup
- Over/under 2.5 goals market signal as a goal-count anchor

---

## STEP 3 — CALIBRATED PREDICTION

Using both my Prediction Profile (Step 1) and the match analysis (Step 2):

**Primary pick** *(plays to my strengths and corrects for my known biases)*:
- Half-Time Score: ${home} X – X ${away}
- Full-Time Score: ${home} X – X ${away}

**Confidence:** Low / Medium / High

**Why this scoreline** (3–5 bullets):
- ...

**Calibration note**: Explain in 1–2 sentences how my historical biases
influenced this pick vs what a neutral analysis would have suggested.

**Backup pick** *(contrarian — use this if differentiation matters more
than expected value given my league position)*:
- Half-Time Score: ${home} X – X ${away}
- Full-Time Score: ${home} X – X ${away}

**Differentiation check**: What scoreline do you think most casual players
in a family/friends pool will pick for this match? Does the primary pick
overlap heavily with that consensus? If so, is my league position strong
enough to justify playing it safe, or should I take the contrarian?

**Points strategy tip**: Based on my per-scoreline HT hit rate and my 0
exact FT history, give me a one-line action: which HT scoreline from my
profitable lines fits this match best, and should I prioritise outcome +
closest or swing for exact scores?

---

## MY PREDICTION HISTORY CSV:

${csv || '[No prediction history available]'}`;
}
