// Keep track of worker state
let isActive = false;

// Wake up on install
chrome.runtime.onInstalled.addListener(() => {
  isActive = true;
  // console.log('Background service worker installed');
});

// Wake up on startup
chrome.runtime.onStartup.addListener(() => {
  isActive = true;
  // console.log('Background service worker started');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Check if the sender is from skool.com
    if (!sender.origin?.includes('skool.com')) {
        // console.log('Message from non-skool.com domain, ignoring');
        return;
    }
    
   
});

// Optional: Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.bookmarks) {
        // console.log('Bookmarks updated:', changes.bookmarks.newValue);
        // print out the entire db
        chrome.storage.local.get(null, (result) => {
            // console.log('Current bookmarks:', result.bookmarks);
        });
    }
});

// Monitor for worker state
setInterval(() => {
    if (isActive) {
        console.log('Worker is active');
    }
}, 10000);

console.log('Background script loaded');