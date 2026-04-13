/**
 * StorageHelper — chrome.storage.sync 우선, local fallback
 * 
 * sync: Chrome 계정 연동 → Extension 재설치해도 유지
 * local: sync 실패 시 fallback
 * 
 * 설정 내보내기/가져오기: JSON 파일로 백업/복원
 */

const SETTINGS_KEYS = [
  'pa-jira-url', 'pa-confluence-url', 'pa-pat',
  'pa-slm-project', 'pa-gen-project', 'pa-default-component',
  'pa-onboarding-done', 'pa-board-id',
];

export async function saveSettings(data: Record<string, any>): Promise<void> {
  try {
    // sync에 저장 (Chrome 계정 연동 시 유지)
    await chrome.storage.sync.set(data);
  } catch {
    // sync 실패 시 local
    try { await chrome.storage.local.set(data); } catch {}
  }
  // local에도 백업 저장 (같은 ID면 바로 로드)
  try { await chrome.storage.local.set(data); } catch {}
}

export async function loadSettings(keys: string[]): Promise<Record<string, any>> {
  let result: Record<string, any> = {};

  // 1차: sync에서 로드
  try {
    result = await chrome.storage.sync.get(keys);
    if (Object.keys(result).length > 0 && result[keys[0]]) return result;
  } catch {}

  // 2차: local에서 로드
  try {
    result = await chrome.storage.local.get(keys);
  } catch {}

  return result;
}

export async function loadAllSettings(): Promise<Record<string, any>> {
  return loadSettings(SETTINGS_KEYS);
}

/** 설정 내보내기 — JSON 문자열 반환 */
export async function exportSettings(): Promise<string> {
  const data = await loadAllSettings();
  // PAT는 마스킹
  const exported = { ...data };
  if (exported['pa-pat']) {
    exported['pa-pat-masked'] = exported['pa-pat'].substring(0, 4) + '****';
  }
  return JSON.stringify(exported, null, 2);
}

/** 설정 가져오기 — JSON 문자열에서 복원 */
export async function importSettings(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json);
    // pa-pat-masked는 무시, 실제 pa-pat만 사용
    delete data['pa-pat-masked'];
    await saveSettings(data);
    return true;
  } catch {
    return false;
  }
}
