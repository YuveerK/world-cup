const SCORE_SEPARATOR = '\u2013';
const EMPTY_SCORE = '\u2014';

export function formatScorePair(home, away) {
  return home != null ? `${home}${SCORE_SEPARATOR}${away}` : EMPTY_SCORE;
}

export function emptyScore() {
  return EMPTY_SCORE;
}
