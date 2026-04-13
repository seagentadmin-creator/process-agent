/**
 * StorageHelper — 설정 영속성 3중 보호
 * 
 * 1차: chrome.storage.sync (Chrome 계정 연동)
 * 2차: chrome.storage.local (Extension ID 내)
 * 3차: Confluence PA-USER-CONFIG (서버 백업, PAT로 식별)
 * 
 * 업데이트 시 같은 폴더 덮어쓰기 → ID 변경 없음 → 1차+2차 유지
 * 만약 ID가 바뀌어도 → 1차(sync)에서 복원
 * sync도 안 되면 → Confluence에서 복원 (Phase 2)
 */

const SETTINGS_KEYS = [
  'pa-jira-url', 'pa-confluence-url', 'pa-pat',
  'pa-slm-project', 'pa-gen-project', 'pa-default-component',
  'pa-confluence-space', 'pa-onboarding-done', 'pa-board-id',
];

export async function saveSettings(data: Record<string, any>): Promise<void> {
  // sync + local 동시 저장
  try { await chrome.storage.sync.set(data); } catch {}
  try { await chrome.storage.local.set(data); } catch {}
}

export async function loadSettings(keys: string[]): Promise<Record<string, any>> {
  // 1차: sync
  try {
    const result = await chrome.storage.sync.get(keys);
    if (Object.keys(result).length > 0 && result[keys[0]]) return result;
  } catch {}
  // 2차: local
  try {
    return await chrome.storage.local.get(keys);
  } catch {}
  return {};
}

export async function loadAllSettings(): Promise<Record<string, any>> {
  return loadSettings(SETTINGS_KEYS);
}

/** 설정 내보내기 — JSON 문자열 반환 */
export async function exportSettings(): Promise<string> {
  const data = await loadAllSettings();
  return JSON.stringify(data, null, 2);
}

/** 설정 가져오기 — JSON 문자열에서 복원 */
export async function importSettings(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json);
    await saveSettings(data);
    return true;
  } catch {
    return false;
  }
}
