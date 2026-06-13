'use strict';

const { mapMatch, mapStatus, isHalfTimePayload, locale } = require('../../src/features/fixtures/fifaFixtures.mapper');

describe('locale()', () => {
  test('prefers en-GB locale', () => {
    const arr = [{ Locale: 'fr-FR', Description: 'Groupe A' }, { Locale: 'en-GB', Description: 'Group A' }];
    expect(locale(arr)).toBe('Group A');
  });

  test('falls back to first element when no en-GB', () => {
    const arr = [{ Locale: 'es-ES', Description: 'Grupo A' }];
    expect(locale(arr)).toBe('Grupo A');
  });

  test('returns null for empty/null input', () => {
    expect(locale(null)).toBe(null);
    expect(locale([])).toBe(null);
  });
});

describe('isHalfTimePayload()', () => {
  test('detects period 4 as half-time', () => {
    expect(isHalfTimePayload({ Period: 4 })).toBe(true);
  });

  test('detects MatchTime "HT" string', () => {
    expect(isHalfTimePayload({ MatchTime: 'HT' })).toBe(true);
    expect(isHalfTimePayload({ MatchTime: 'HALF TIME' })).toBe(true);
  });

  test('normal live match is not half-time', () => {
    expect(isHalfTimePayload({ Period: 3, MatchTime: '67', MatchStatus: 3 })).toBe(false);
  });
});

describe('mapStatus()', () => {
  test('maps code 2 to FINISHED', () => {
    expect(mapStatus({ MatchStatus: 2, HomeTeamScore: null, AwayTeamScore: null })).toBe('FINISHED');
  });

  test('maps code 3 to LIVE', () => {
    expect(mapStatus({ MatchStatus: 3 })).toBe('LIVE');
  });

  test('infers FINISHED when past date and has score even if status is 1', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const match = { MatchStatus: 1, HomeTeamScore: 2, AwayTeamScore: 1, Date: pastDate };
    expect(mapStatus(match)).toBe('FINISHED');
  });

  test('does NOT infer FINISHED for a future match with score', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const match = { MatchStatus: 1, HomeTeamScore: 0, AwayTeamScore: 0, Date: futureDate };
    expect(mapStatus(match)).toBe('UPCOMING');
  });
});

describe('mapMatch()', () => {
  const baseMatch = {
    IdMatch: '12345',
    IdStage: '99',
    MatchStatus: 1,
    Date: '2026-06-20T18:00:00Z',
    LocalDate: '2026-06-20T20:00:00+02:00',
    Home: {
      TeamName: [{ Locale: 'en-GB', Description: 'Brazil' }],
      Abbreviation: 'BRA',
      IdCountry: 'BRA',
      PictureUrl: null,
      Score: null,
    },
    Away: {
      TeamName: [{ Locale: 'en-GB', Description: 'Argentina' }],
      Abbreviation: 'ARG',
      IdCountry: 'ARG',
      PictureUrl: null,
      Score: null,
    },
    StageName: [{ Locale: 'en-GB', Description: 'Group Stage' }],
    GroupName: [{ Locale: 'en-GB', Description: 'Group C' }],
    Stadium: {
      Name: [{ Locale: 'en-GB', Description: 'MetLife Stadium' }],
      CityName: [{ Locale: 'en-GB', Description: 'East Rutherford' }],
      IdCountry: 'USA',
    },
  };

  test('maps match id and teams correctly', () => {
    const result = mapMatch(baseMatch);
    expect(result.id).toBe('12345');
    expect(result.home.name).toBe('Brazil');
    expect(result.away.name).toBe('Argentina');
  });

  test('score is null when HomeTeamScore/AwayTeamScore are null', () => {
    const result = mapMatch({ ...baseMatch, HomeTeamScore: null, AwayTeamScore: null });
    expect(result.score).toBe(null);
  });

  test('score is populated when scores are present', () => {
    const result = mapMatch({ ...baseMatch, HomeTeamScore: 3, AwayTeamScore: 1 });
    expect(result.score).toEqual({ home: 3, away: 1, homePenalty: null, awayPenalty: null });
  });

  test('uses placeholder when home team is missing', () => {
    const { Home, ...noHome } = baseMatch;
    const result = mapMatch({ ...noHome, PlaceHolderA: 'Winner Group A' });
    expect(result.home.name).toBe('Winner Group A');
    expect(result.home.abbreviation).toBe('TBD');
  });

  test('builds correct FIFA URL', () => {
    const result = mapMatch(baseMatch);
    expect(result.url).toContain('12345');
    expect(result.url).toContain('99');
  });
});
