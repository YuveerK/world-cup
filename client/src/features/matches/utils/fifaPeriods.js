// FIFA live endpoint period codes.
// Confirmed via 2022 and 2018 World Cup timelines.
// Odd = active play, even = interval/break/concluded.
export const FIFA_PERIODS = {
  PRE_MATCH:       0,  // before kickoff
  FIRST_HALF:      3,  // 1H play (45 min)
  REGULAR_HT:      4,  // half-time interval between 1H and 2H
  SECOND_HALF:     5,  // 2H play (90 min)
  PRE_ET_INTERVAL: 6,  // gap between 90-min end and ET start
  ET_FIRST_HALF:   7,  // ET 1H play (105 min)
  ET_HT:           8,  // ET half-time interval between ET 1H and ET 2H
  ET_SECOND_HALF:  9,  // ET 2H play (120 min)
  MATCH_OVER:      10, // match concluded — set for ALL finished matches
  PENALTIES:       11, // penalty shootout
};
