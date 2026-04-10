import { FieldResolver } from '../../../src/domain/transition/field-resolver';
import { createChecklistState, isItemComplete, validateChecklist } from '../../../src/domain/transition/checklist-validator';
import { shouldCheck, checkUrlFormat, checkKeywords, getRequiredStages, isAllPassed } from '../../../src/domain/transition/output-validator';
import { FieldConfig, ChecklistItem } from '../../../src/core/types';

// === FieldResolver Tests ===
describe('FieldResolver', () => {
  const resolver = new FieldResolver();
  const commonFields: FieldConfig[] = [
    { fieldKey: 'cf_101', fieldName: '점검결과', fieldType: 'textarea', required: true },
    { fieldKey: 'cf_102', fieldName: '조치사항', fieldType: 'textarea', required: true },
    { fieldKey: 'cf_103', fieldName: '점검일자', fieldType: 'date', required: true },
  ];
  const variableFields: FieldConfig[] = [
    { fieldKey: 'cf_201', fieldName: '절연저항값', fieldType: 'number', required: true },
    { fieldKey: 'cf_202', fieldName: '접지상태', fieldType: 'select', required: true },
  ];
  const commonCL: ChecklistItem[] = [
    { order: 1, type: 'link_action', question: '증빙 첨부?', required: true, helpMessage: '' },
  ];
  const variableCL: ChecklistItem[] = [
    { order: 2, type: 'field_check', question: '절연저항?', required: true, fieldKey: 'cf_201', helpMessage: '' },
    { order: 3, type: 'confirm', question: '장비 교정?', required: true, helpMessage: '' },
  ];

  test('FR-01: 공통+가변 병합', () => {
    const result = resolver.resolve(commonFields, variableFields, commonCL, variableCL);
    expect(result.fields).toHaveLength(5);
    expect(result.hasVariable).toBe(true);
  });

  test('FR-02: 공통만 (가변 없음)', () => {
    const result = resolver.resolve(commonFields, null, commonCL, null);
    expect(result.fields).toHaveLength(3);
    expect(result.hasVariable).toBe(false);
  });

  test('FR-03: 공통 CL + 가변 CL 병합', () => {
    const result = resolver.resolve(commonFields, null, commonCL, variableCL);
    const merged = resolver.getMergedChecklist(result);
    expect(merged).toHaveLength(3);
  });

  test('FR-04: 가변 CL 없음', () => {
    const result = resolver.resolve(commonFields, null, commonCL, null);
    expect(result.checklist.hasVariable).toBe(false);
    const merged = resolver.getMergedChecklist(result);
    expect(merged).toHaveLength(1);
  });

  test('FR-05: 빈 공통 필드', () => {
    const result = resolver.resolve([], variableFields, commonCL, null);
    expect(result.fields).toHaveLength(2);
  });
});

// === ChecklistValidator Tests ===
describe('ChecklistValidator', () => {
  const requiredFieldCheck: ChecklistItem = { order: 1, type: 'field_check', question: '점검결과?', required: true, fieldKey: 'cf_101', helpMessage: '' };
  const requiredConfirm: ChecklistItem = { order: 2, type: 'confirm', question: '통보?', required: true, helpMessage: '' };
  const optionalConfirm: ChecklistItem = { order: 3, type: 'confirm', question: '추가?', required: false, helpMessage: '' };
  const requiredLink: ChecklistItem = { order: 4, type: 'link_action', question: '첨부?', required: true, helpMessage: '' };

  test('CV-01: field_check 완료 (값 있음)', () => {
    const state = createChecklistState(requiredFieldCheck);
    state.fieldValue = '측정 완료';
    expect(isItemComplete(state)).toBe(true);
  });

  test('CV-02: field_check 미완료 (값 없음)', () => {
    const state = createChecklistState(requiredFieldCheck);
    expect(isItemComplete(state)).toBe(false);
  });

  test('CV-03: confirm 확인 완료', () => {
    const state = createChecklistState(requiredConfirm);
    state.completed = true;
    expect(isItemComplete(state)).toBe(true);
  });

  test('CV-04: confirm 해당없음', () => {
    const state = createChecklistState(requiredConfirm);
    state.notApplicable = true;
    expect(isItemComplete(state)).toBe(true);
  });

  test('CV-05: confirm 미확인', () => {
    const state = createChecklistState(requiredConfirm);
    expect(isItemComplete(state)).toBe(false);
  });

  test('CV-06: link_action 확인 완료', () => {
    const state = createChecklistState(requiredLink);
    state.completed = true;
    expect(isItemComplete(state)).toBe(true);
  });

  test('CV-07: 필수 항목 전체 완료 → canTransition=true', () => {
    const states = [
      { ...createChecklistState(requiredFieldCheck), fieldValue: '완료' },
      { ...createChecklistState(requiredConfirm), completed: true },
      { ...createChecklistState(optionalConfirm) }, // optional, 미완료
    ];
    const result = validateChecklist(states);
    expect(result.canTransition).toBe(true);
  });

  test('CV-08: 필수 항목 일부 미완료 → canTransition=false', () => {
    const states = [
      { ...createChecklistState(requiredFieldCheck), fieldValue: '완료' },
      createChecklistState(requiredConfirm), // 미완료
    ];
    const result = validateChecklist(states);
    expect(result.canTransition).toBe(false);
    expect(result.completedRequired).toBe(1);
  });

  test('CV-09: 비필수 미완료 허용', () => {
    const states = [
      createChecklistState(optionalConfirm), // optional, 미완료
    ];
    const result = validateChecklist(states);
    expect(result.canTransition).toBe(true);
  });
});

// === OutputValidator Tests ===
describe('OutputValidator', () => {
  test('OV-01: MP Use=N → 스킵', () => {
    expect(shouldCheck('N', 'URL').check).toBe(false);
  });

  test('OV-02: Output Type=None → 스킵', () => {
    expect(shouldCheck('Y', 'None').check).toBe(false);
  });

  test('OV-03: Output Type=Auto → 스킵', () => {
    const result = shouldCheck('Y', 'Auto');
    expect(result.check).toBe(false);
    expect(result.reason).toContain('Auto');
  });

  test('OV-04: URL 형식 유효', () => {
    expect(checkUrlFormat('https://example.com/page').passed).toBe(true);
  });

  test('OV-05: URL 형식 무효', () => {
    expect(checkUrlFormat('not-a-url').passed).toBe(false);
  });

  test('OV-08: 키워드 전체 포함', () => {
    const config = { checkLevel: '1-4' as const, keywords: [{ word: '측정결과', required: true }, { word: '판정', required: true }] };
    const result = checkKeywords('이 문서에는 측정결과와 판정 내용이 포함됩니다', config);
    expect(result.passed).toBe(true);
  });

  test('OV-09: 키워드 일부 누락', () => {
    const config = { checkLevel: '1-4' as const, keywords: [{ word: '측정결과', required: true }, { word: '판정', required: true }] };
    const result = checkKeywords('이 문서에는 측정결과만 있습니다', config);
    expect(result.passed).toBe(false);
  });

  test('OV-10: 체크 수준 1~2 → 3,4단계 미포함', () => {
    const stages = getRequiredStages('1-2', true);
    expect(stages).toEqual(['format', 'access']);
    expect(stages).not.toContain('keyword');
    expect(stages).not.toContain('ai');
  });

  test('OV-11: AI OFF → ai 단계 미포함', () => {
    const stages = getRequiredStages('1-4', false);
    expect(stages).toContain('keyword');
    expect(stages).not.toContain('ai');
  });

  test('OV-11b: AI ON + 1-4 → 모든 단계', () => {
    const stages = getRequiredStages('1-4', true);
    expect(stages).toEqual(['format', 'access', 'keyword', 'ai']);
  });

  test('isAllPassed', () => {
    expect(isAllPassed([
      { stage: 'format', passed: true, message: '' },
      { stage: 'access', passed: true, message: '' },
    ])).toBe(true);

    expect(isAllPassed([
      { stage: 'format', passed: true, message: '' },
      { stage: 'access', passed: false, message: '' },
    ])).toBe(false);
  });
});
