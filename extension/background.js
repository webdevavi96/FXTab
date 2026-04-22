let activeTabId = null;
let startTime = null;
let currentUrl = null;

chrome.tabs.onActivated.addListener((activeInfo) => {
  const now = Date.now();

  if (activeTabId !== null && startTime !== null && currentUrl) {
    const timeSpent = now - startTime;
    saveTime(currentUrl, timeSpent);
  }

  activeTabId = activeInfo.tabId;
  startTime = now;

  chrome.tabs.get(activeTabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url) return;
    currentUrl = tab.url;
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.status === "complete") {
    startTime = Date.now();
    if (tab.url) currentUrl = tab.url;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId && startTime && currentUrl) {
    const timeSpent = Date.now() - startTime;
    saveTime(currentUrl, timeSpent);
  }
});

function saveTime(url, timeSpent) {
  const domain = new URL(url).hostname;

  chrome.storage.local.get("timeData", ({ timeData = {} }) => {
    timeData[domain] = (timeData[domain] || 0) + timeSpent;
    chrome.storage.local.set({ timeData });
  });
}
