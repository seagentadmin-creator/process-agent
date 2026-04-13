import { loadSettings } from '../core/storage-helper';

// Side Panel
chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });
chrome.action.onClicked.addListener((tab: any) => {
  chrome.sidePanel?.open?.({ tabId: tab.id });
});

// Polling: 10분 주기 캐시 갱신
chrome.alarms.create('pa-polling', { periodInMinutes: 10 });

chrome.alarms.onAlarm.addListener(async (alarm: any) => {
  if (alarm.name === 'pa-polling') {
    try {
      const config = await loadSettings(['pa-jira-url', 'pa-pat']);
      if (config['pa-jira-url'] && config['pa-pat']) {
        chrome.runtime.sendMessage({ type: 'CACHE_REFRESH' }).catch(() => {});
      }
    } catch {}
  }
});

// 설정 변경 감지
chrome.storage.onChanged.addListener((changes: any, area: string) => {
  if ((area === 'local' || area === 'sync') && (changes['pa-jira-url'] || changes['pa-pat'])) {
    chrome.runtime.sendMessage({ type: 'CONFIG_CHANGED' }).catch(() => {});
  }
});
