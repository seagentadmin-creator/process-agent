import { GuideMatcher } from '../../../src/domain/guide/guide-matcher';
import { GuideMapping } from '../../../src/core/types';

describe('GuideMatcher', () => {
  const mappings: GuideMapping[] = [
    { priority: 1, matchType: 'exact', issueType: 'A', condition: '전기안전점검', guideCode: 'A-001' },
    { priority: 1, matchType: 'exact', issueType: 'A', condition: '소방설비점검', guideCode: 'A-002' },
    { priority: 1, matchType: 'exact', issueType: 'B', condition: '용접작업허가', guideCode: 'B-001' },
    { priority: 2, matchType: 'pattern', issueType: 'A', condition: '.*안전.*점검.*', guideCode: 'A-DEFAULT-SAFETY' },
    { priority: 2, matchType: 'keyword', issueType: 'B', condition: '허가,승인', guideCode: 'B-DEFAULT-APPROVAL' },
    { priority: 3, matchType: 'default', issueType: 'A', condition: '', guideCode: 'A-DEFAULT' },
    { priority: 3, matchType: 'default', issueType: 'B', condition: '', guideCode: 'B-DEFAULT' },
  ];

  let matcher: GuideMatcher;

  beforeEach(() => {
    matcher = new GuideMatcher(mappings);
  });

  test('GM-01: exact 매칭 성공', () => {
    expect(matcher.match('전기안전점검', 'A')).toBe('A-001');
  });

  test('GM-02: exact 실패 → pattern fallback', () => {
    expect(matcher.match('전기설비안전점검보고', 'A')).toBe('A-DEFAULT-SAFETY');
  });

  test('GM-03: pattern도 실패 → default fallback', () => {
    expect(matcher.match('미등록항목', 'A')).toBe('A-DEFAULT');
  });

  test('GM-04: 매핑 테이블 비어있을 때', () => {
    const emptyMatcher = new GuideMatcher([]);
    expect(emptyMatcher.match('전기안전점검', 'A')).toBeNull();
  });

  test('GM-05: 정규식 패턴 매칭', () => {
    expect(matcher.match('가스안전관리점검', 'A')).toBe('A-DEFAULT-SAFETY');
  });

  test('GM-06: 키워드 매칭 (쉼표 구분)', () => {
    expect(matcher.match('작업승인요청서', 'B')).toBe('B-DEFAULT-APPROVAL');
  });

  test('GM-07: 우선순위 (exact > pattern > default)', () => {
    // '전기안전점검'은 exact도 매칭, pattern도 매칭 → exact 우선
    expect(matcher.match('전기안전점검', 'A')).toBe('A-001');
  });

  test('GM-07b: 다른 issueType의 exact는 매칭 안됨', () => {
    expect(matcher.match('전기안전점검', 'B')).not.toBe('A-001');
  });
});
