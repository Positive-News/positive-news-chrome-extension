chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.debug('Received message:', message);
    if (message.action === "updateBadge") {
        chrome.action.setBadgeText({
            tabId: sender.tab.id,
            text: message.count.toString()
        });
    }
});
  