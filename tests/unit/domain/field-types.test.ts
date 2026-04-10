import { canReuseField } from '../../../src/shared/constants/field-types';

describe('Field Reuse Policy', () => {
  test('always 재사용 가능 필드', () => {
    expect(canReuseField('text')).toBe('always');
    expect(canReuseField('textarea')).toBe('always');
    expect(canReuseField('number')).toBe('always');
    expect(canReuseField('url')).toBe('always');
    expect(canReuseField('label')).toBe('always');
  });

  test('never 재사용 불가 필드', () => {
    expect(canReuseField('date')).toBe('never');
    expect(canReuseField('datetime')).toBe('never');
    expect(canReuseField('user')).toBe('never');
    expect(canReuseField('attachment')).toBe('never');
  });

  test('conditional 조건부 재사용 필드', () => {
    expect(canReuseField('select')).toBe('conditional');
    expect(canReuseField('multiselect')).toBe('conditional');
    expect(canReuseField('radio')).toBe('conditional');
    expect(canReuseField('checkbox')).toBe('conditional');
    expect(canReuseField('cascading')).toBe('conditional');
  });
});
