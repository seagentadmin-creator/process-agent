import { tokenize, calculateSimilarity, rankBySimilarity } from '../../../src/domain/task/title-similarity';

describe('TitleSimilarity', () => {
  describe('tokenize', () => {
    test('기본 토큰화', () => {
      expect(tokenize('전기안전점검-2공장')).toEqual(['전기안전점검', '2공장']);
    });

    test('날짜/분기 토큰 제거', () => {
      const tokens = tokenize('전기안전점검-2공장-2026Q1');
      expect(tokens).not.toContain('2026q1');
      expect(tokens).toContain('전기안전점검');
      expect(tokens).toContain('2공장');
    });

    test('빈 문자열', () => {
      expect(tokenize('')).toEqual([]);
    });
  });

  describe('calculateSimilarity', () => {
    test('TS-01: 완전 일치 키워드 (위치만 다름)', () => {
      const score = calculateSimilarity('전기안전점검-2공장', '전기안전점검-1공장');
      expect(score).toBeGreaterThanOrEqual(30);
    });

    test('TS-02: 부분 일치', () => {
      const score = calculateSimilarity('전기안전점검', '전기설비점검');
      expect(score).toBeGreaterThanOrEqual(5);
      expect(score).toBeLessThan(70);
    });

    test('TS-03: 무관한 제목', () => {
      const score = calculateSimilarity('전기안전점검', '소방설비검토');
      expect(score).toBeLessThan(20);
    });

    test('TS-04: 날짜 무시하고 비교', () => {
      const score = calculateSimilarity('점검-2026Q1', '점검-2025H2');
      expect(score).toBeGreaterThan(0);
    });

    test('TS-05: 같은 Issue Type 가산', () => {
      const withType = calculateSimilarity('전기점검', '전기점검', true);
      const withoutType = calculateSimilarity('전기점검', '전기점검', false);
      expect(withType).toBe(withoutType + 10);
    });

    test('TS-06: 빈 제목', () => {
      expect(calculateSimilarity('', '전기안전점검')).toBe(0);
      expect(calculateSimilarity('전기안전점검', '')).toBe(0);
    });

    test('점수 최대 100', () => {
      const score = calculateSimilarity('전기안전점검-2공장', '전기안전점검-2공장', true, true);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('rankBySimilarity', () => {
    test('TS-07: 결과 점수 내림차순 정렬', () => {
      const candidates = [
        { key: 'A', title: '소방설비', issueType: 'A' },
        { key: 'B', title: '전기안전점검-1공장', issueType: 'A' },
        { key: 'C', title: '전기안전점검-2공장', issueType: 'A' },
      ];
      const results = rankBySimilarity('전기안전점검-2공장', candidates, 'A');
      expect(results[0].issueKey).toBe('C');
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    });

    test('topN 제한', () => {
      const candidates = Array.from({ length: 10 }, (_, i) => ({
        key: `K-${i}`, title: `전기점검-${i}공장`, issueType: 'A',
      }));
      const results = rankBySimilarity('전기점검', candidates, 'A', 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });
});
