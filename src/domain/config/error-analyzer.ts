import { PossibleCause, UserAction } from '../../core/types';

export function analyzeCause(errorCode: string): PossibleCause[] {
  const causes: PossibleCause[] = [];

  switch (errorCode) {
    case '403':
      causes.push(
        { priority: 1, cause: '사용자 전이 권한 부족', resolution: 'Jira Permission Scheme에서 Transition 권한 확인' },
        { priority: 2, cause: 'Workflow 조건 미충족', resolution: 'Workflow Validator/Condition 확인' },
      );
      break;
    case '404':
      causes.push(
        { priority: 1, cause: '대상 Issue 삭제 또는 이동됨', resolution: 'Issue 존재 여부 확인' },
      );
      break;
    case '500':
      causes.push(
        { priority: 1, cause: 'Jira 서버 내부 오류', resolution: 'Jira 서버 로그 확인, 재시도 요청' },
      );
      break;
    case 'TIMEOUT':
      causes.push(
        { priority: 1, cause: '네트워크 지연 또는 서버 과부하', resolution: '네트워크 상태 확인, 서버 부하 모니터링' },
      );
      break;
    case 'PARSE_ERROR':
      causes.push(
        { priority: 1, cause: 'Confluence 페이지 데이터 형식 오류', resolution: 'Admin UI에서 해당 항목 재저장' },
      );
      break;
    case 'AI_TIMEOUT':
      causes.push(
        { priority: 1, cause: 'AI Provider 응답 지연', resolution: 'AI Provider 상태 확인, 대체 Provider 사용' },
      );
      break;
    case 'AI_AUTH':
      causes.push(
        { priority: 1, cause: 'AI API Key 만료 또는 무효', resolution: 'Admin 설정에서 API Key 갱신' },
      );
      break;
    default:
      causes.push(
        { priority: 1, cause: `알 수 없는 오류 (${errorCode})`, resolution: 'Admin에게 문의' },
      );
  }

  return causes;
}

export function getUserActions(errorCode: string, targetIssue?: string): UserAction[] {
  const actions: UserAction[] = [];

  switch (errorCode) {
    case '403':
      actions.push(
        { description: 'Jira에서 해당 과제의 전이 권한을 확인하세요', link: targetIssue ? `/browse/${targetIssue}` : undefined },
        { description: 'Jira Workflow를 확인하세요' },
      );
      break;
    case '404':
      actions.push(
        { description: 'Jira에서 과제가 존재하는지 확인하세요', link: targetIssue ? `/browse/${targetIssue}` : undefined },
      );
      break;
    case '500':
    case 'TIMEOUT':
      actions.push(
        { description: '잠시 후 다시 시도하세요' },
        { description: 'VPN/네트워크 연결을 확인하세요' },
      );
      break;
    case 'AI_TIMEOUT':
    case 'AI_AUTH':
      actions.push(
        { description: '잠시 후 다시 시도하세요' },
        { description: 'Admin에게 AI Provider 상태를 확인 요청하세요' },
      );
      break;
    default:
      actions.push({ description: 'Admin에게 문의하세요' });
  }

  return actions;
}

export function shouldCreateVOC(errorCode: string, recentErrors: { hash: string; timestamp: string }[], errorHash: string): boolean {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recent = recentErrors.find(e => e.hash === errorHash && new Date(e.timestamp).getTime() > oneHourAgo);
  if (recent) return false;

  const userErrors = ['VALIDATION', 'CANCELLED'];
  if (userErrors.includes(errorCode)) return false;

  return true;
}
