// Open side panel when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Auto-open side panel when user enters a meeting page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  const meetingUrls = [
    "https://meet.google.com/",
    "https://zoom.us/wc/",
    "https://teams.microsoft.com/",
  ];
  const isMeeting = meetingUrls.some((u) => tab.url?.startsWith(u));
  if (isMeeting) {
    // Notify sidepanel that a meeting page is active
    chrome.storage.session.set({ activeMeetingTab: tabId, activeMeetingUrl: tab.url });
  }
});

// Relay messages between content scripts and sidepanel
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "MEETING_DETECTED") {
    chrome.storage.session.set({ meetingInfo: msg.payload });
    sendResponse({ ok: true });
  }
  return true;
});
