import { FieldType, ReusePolicy } from '../../core/types';

export const REUSE_POLICY: Record<FieldType, ReusePolicy> = {
  text: 'always',
  textarea: 'always',
  number: 'always',
  url: 'always',
  label: 'always',
  date: 'never',
  datetime: 'never',
  user: 'never',
  attachment: 'never',
  select: 'conditional',
  multiselect: 'conditional',
  radio: 'conditional',
  checkbox: 'conditional',
  cascading: 'conditional',
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: '텍스트',
  textarea: '여러 줄 텍스트',
  number: '숫자',
  date: '날짜',
  datetime: '날짜+시간',
  select: '단일 선택',
  multiselect: '다중 선택',
  radio: '라디오',
  checkbox: '체크박스',
  user: '사용자',
  label: '라벨',
  url: 'URL',
  attachment: '첨부파일',
  cascading: '종속 선택',
};

export function canReuseField(fieldType: FieldType): ReusePolicy {
  return REUSE_POLICY[fieldType] ?? 'never';
}
