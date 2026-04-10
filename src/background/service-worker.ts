import { APP_CONFIG } from '../shared/constants/app-config';

// Open side panel on action click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Set side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// Alarm for periodic manifest check
chrome.alarms.create('manifest-check', {
  periodInMinutes: APP_CONFIG.defaults.pollingIntervalMs / 60000,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'manifest-check') {
    // Notify side panel to check manifest
    chrome.runtime.sendMessage({ type: 'MANIFEST_CHECK' }).catch(() => {});
  }
});

// Handle messages from side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_VERSION') {
    sendResponse({ version: APP_CONFIG.version, name: APP_CONFIG.name });
    return true;
  }
});

console.log(`[${APP_CONFIG.name}] Service Worker initialized`);
