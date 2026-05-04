// background/service-worker.js
// Background service worker for the Review Booster extension

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Review Booster] Extension installed:", details.reason);
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTabInfo") {
    sendResponse({
      url: sender.url,
      tabId: sender.tab?.id,
    });
  }
});
