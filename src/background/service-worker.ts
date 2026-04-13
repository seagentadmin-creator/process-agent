import { loadSettings } from '../core/storage-helper';
import { checkUpdateViaGitHub, performUpdate } from '../core/updater/auto-updater';

chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });

chrome.action.onClicked.addListener((tab: any) => {
  chrome.sidePanel?.open?.({ tabId: tab.id });
});

chrome.alarms.create('pa-polling', { periodInMinutes: 10 });
chrome.alarms.create('pa-update-check', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm: any) => {
  if (alarm.name === 'pa-polling') {
    try {
      const config = await loadSettings(['pa-jira-url', 'pa-pat']);
      if (config['pa-jira-url'] && config['pa-pat']) {
        chrome.runtime.sendMessage({ type: 'CACHE_REFRESH' }).catch(() => {});
      }
    } catch {}
  }
  if (alarm.name === 'pa-update-check') {
    try {
      const config = await loadSettings(['pa-github-owner', 'pa-github-repo']);
      const owner = config['pa-github-owner'] as string;
      const repo = config['pa-github-repo'] as string;
      if (owner && repo) {
        const result = await checkUpdateViaGitHub(owner, repo);
        if (result?.hasUpdate) {
          chrome.runtime.sendMessage({ type: 'UPDATE_AVAILABLE', version: result.version }).catch(() => {});
        }
      }
    } catch {}
  }
});

chrome.storage.onChanged.addListener((changes: any, area: string) => {
  if (area === 'local' && (changes['pa-jira-url'] || changes['pa-pat'])) {
    chrome.runtime.sendMessage({ type: 'CONFIG_CHANGED' }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
  if (message.type === 'CHECK_UPDATE') {
    (async () => {
      try {
        const config = await loadSettings(['pa-github-owner', 'pa-github-repo']);
        const result = await checkUpdateViaGitHub(config['pa-github-owner'] as string, config['pa-github-repo'] as string);
        sendResponse(result || { hasUpdate: false });
      } catch (e) {
        sendResponse({ hasUpdate: false, error: String(e) });
      }
    })();
    return true;
  }
});
