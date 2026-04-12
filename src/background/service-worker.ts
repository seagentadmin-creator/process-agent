import { APP_CONFIG } from '../shared/constants/app-config';
import { isNativeHostAvailable, checkUpdateViaGitHub, autoUpdate } from '../core/updater/auto-updater';

// Side Panel 열기
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) chrome.sidePanel.open({ tabId: tab.id });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// 주기적 업데이트 체크 (10분)
chrome.alarms.create('update-check', {
  periodInMinutes: APP_CONFIG.defaults.pollingIntervalMs / 60000,
});

// Manifest 체크 (설정 데이터 갱신)
chrome.alarms.create('manifest-check', {
  periodInMinutes: APP_CONFIG.defaults.pollingIntervalMs / 60000,
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'update-check') {
    await checkExtensionUpdate();
  }
  if (alarm.name === 'manifest-check') {
    chrome.runtime.sendMessage({ type: 'MANIFEST_CHECK' }).catch(() => {});
  }
});

async function checkExtensionUpdate() {
  try {
    // GitHub 설정은 storage에서 읽기
    const config = await chrome.storage.local.get(['pa-github-owner', 'pa-github-repo']);
    const owner = config['pa-github-owner'] as string;
    const repo = config['pa-github-repo'] as string;
    if (!owner || !repo) return;

    const updateInfo = await checkUpdateViaGitHub(owner, repo);
    if (!updateInfo) return;

    // Native Host 자동 업데이트 시도
    const nativeAvailable = await isNativeHostAvailable();
    if (nativeAvailable) {
      const result = await autoUpdate();
      if (result.success) return; // 자동 완료
    }

    // 수동 업데이트 알림
    chrome.runtime.sendMessage({
      type: 'UPDATE_AVAILABLE',
      version: updateInfo.version,
      notes: updateInfo.notes,
      downloadUrl: updateInfo.downloadUrl,
      nativeAvailable,
    }).catch(() => {});

  } catch (e) {
    console.error(`[${APP_CONFIG.name}] Update check failed:`, e);
  }
}

// 메시지 핸들러
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_VERSION') {
    sendResponse({ version: APP_CONFIG.version, name: APP_CONFIG.name });
    return true;
  }
  if (message.type === 'TRIGGER_UPDATE_CHECK') {
    checkExtensionUpdate().then(() => sendResponse({ done: true }));
    return true;
  }
  if (message.type === 'TRIGGER_AUTO_UPDATE') {
    autoUpdate(message.installDir).then(sendResponse);
    return true;
  }
});

console.log(`[${APP_CONFIG.name}] Service Worker v${APP_CONFIG.version} initialized`);
