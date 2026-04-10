import { QualityCheckConfig } from '../../core/types';

export type CheckStage = 'format' | 'access' | 'keyword' | 'ai';
export type StageResult = { stage: CheckStage; passed: boolean; message: string; details?: any };

export interface OutputCheckResult {
  skipped: boolean;
  skipReason?: string;
  stages: StageResult[];
  allPassed: boolean;
}

const URL_REGEX = /^https?:\/\/.+/i;

export function shouldCheck(mpUse: string, outputType: string): { check: boolean; reason?: string } {
  if (mpUse !== 'Y') return { check: false, reason: 'Management Point Use is not Y' };
  if (outputType === 'None') return { check: false, reason: 'Output Type is None' };
  if (outputType === 'Auto') return { check: false, reason: 'Auto type - managed by external system' };
  if (outputType === 'URL') return { check: true };
  return { check: false, reason: `Unknown output type: ${outputType}` };
}

export function checkUrlFormat(url: string): StageResult {
  const passed = URL_REGEX.test(url);
  return {
    stage: 'format',
    passed,
    message: passed ? 'URL 형식 유효' : 'URL 형식이 올바르지 않습니다 (http/https로 시작)',
  };
}

export function checkKeywords(
  pageContent: string,
  config: QualityCheckConfig,
): StageResult {
  const results = config.keywords.map(kw => ({
    word: kw.word,
    required: kw.required,
    found: pageContent.toLowerCase().includes(kw.word.toLowerCase()),
  }));

  const requiredMissing = results.filter(r => r.required && !r.found);
  const passed = requiredMissing.length === 0;

  return {
    stage: 'keyword',
    passed,
    message: passed
      ? '필수 키워드 확인 완료'
      : `필수 키워드 누락: ${requiredMissing.map(r => r.word).join(', ')}`,
    details: results,
  };
}

export function getRequiredStages(checkLevel: '1-2' | '1-4', aiEnabled: boolean): CheckStage[] {
  const stages: CheckStage[] = ['format', 'access'];
  if (checkLevel === '1-4') {
    stages.push('keyword');
    if (aiEnabled) stages.push('ai');
  }
  return stages;
}

export function isAllPassed(stages: StageResult[]): boolean {
  return stages.every(s => s.passed);
}
