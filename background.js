// Background service worker for Chrome extension

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSettings') {
    // Open settings page with pre-filled store name
    const url = chrome.runtime.getURL('settings.html');
    if (message.storeName) {
      chrome.tabs.create({ url: `${url}?storeName=${encodeURIComponent(message.storeName)}` });
    } else {
      chrome.runtime.openOptionsPage();
    }
    sendResponse({ success: true });
  }
  return true;
});

// Listen for tab updates to detect Shopify URLs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when the page is fully loaded
  if (changeInfo.status !== 'complete' || !tab.url) {
    return;
  }

  // Check if URL is a Shopify domain
  try {
    const url = new URL(tab.url);
    if (url.hostname.includes('.shopify.com')) {
      // The content script will handle the prompt
      // We just need to ensure it's injected
    }
  } catch (e) {
    // Invalid URL, ignore
  }
});

