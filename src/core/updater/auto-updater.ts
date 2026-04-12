/**
 * Extension Self-Update via Native Messaging Host
 * 
 * Flow:
 *   1. checkForUpdate() — GitHub Release 최신 버전 확인
 *   2. Native Host 연결 시도
 *      → 성공: autoUpdate() — 다운로드 + 덮어쓰기 + reload
 *      → 실패: 수동 업데이트 안내
 */

const NATIVE_HOST_NAME = 'com.process_agent.updater';

interface UpdateCheckResult {
  version: string;
  zip_url: string | null;
  notes: string;
  error?: string;
}

interface UpdateResult {
  success: boolean;
  version?: string;
  error?: string;
}

/**
 * Native Host가 설치되어 있는지 확인
 */
export async function isNativeHostAvailable(): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, { action: 'check' });
    return !!response && !response.error;
  } catch {
    return false;
  }
}

/**
 * Native Host를 통해 최신 버전 확인
 */
export async function checkUpdateViaNativeHost(): Promise<UpdateCheckResult | null> {
  try {
    const response = await chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, { action: 'check' });
    return response as UpdateCheckResult;
  } catch {
    return null;
  }
}

/**
 * Native Host를 통해 자동 업데이트 실행
 */
export async function autoUpdate(installDir?: string): Promise<UpdateResult> {
  try {
    const response = await chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, {
      action: 'update',
      installDir,
    });

    const result = response as UpdateResult;

    if (result.success) {
      // Extension 자동 재시작
      chrome.runtime.reload();
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Native Host connection failed' };
  }
}

/**
 * GitHub API를 통해 직접 최신 버전 확인 (Native Host 없어도 동작)
 */
export async function checkUpdateViaGitHub(owner: string, repo: string): Promise<{ hasUpdate: boolean; version: string; notes: string; downloadUrl: string } | null> {
  try {
    const currentVersion = chrome.runtime.getManifest().version;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
    if (!response.ok) return null;

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');

    if (!isNewerVersion(currentVersion, latestVersion)) {
      return null; // 최신 버전 사용 중
    }

    const zipAsset = release.assets?.find((a: any) => a.name.endsWith('.zip'));

    return {
      hasUpdate: true,
      version: latestVersion,
      notes: release.body || '',
      downloadUrl: zipAsset?.browser_download_url || '',
    };
  } catch {
    return null;
  }
}

/**
 * 전체 업데이트 흐름 (하이브리드)
 */
export async function performUpdate(owner: string, repo: string): Promise<{
  method: 'auto' | 'manual';
  success: boolean;
  version?: string;
  error?: string;
  downloadUrl?: string;
}> {
  // 1. Native Host 시도
  const nativeAvailable = await isNativeHostAvailable();

  if (nativeAvailable) {
    const result = await autoUpdate();
    if (result.success) {
      return { method: 'auto', success: true, version: result.version };
    }
    // Native Host 실패 시 수동으로 fallback
  }

  // 2. 수동 업데이트 안내
  const updateInfo = await checkUpdateViaGitHub(owner, repo);
  if (!updateInfo) {
    return { method: 'manual', success: false, error: 'No update available' };
  }

  return {
    method: 'manual',
    success: false,
    version: updateInfo.version,
    error: 'Native Host가 설치되어 있지 않습니다. 수동 업데이트가 필요합니다.',
    downloadUrl: updateInfo.downloadUrl,
  };
}

/**
 * 버전 비교 (semver)
 */
function isNewerVersion(current: string, latest: string): boolean {
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}
