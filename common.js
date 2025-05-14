// Function to load the cache from chrome.storage.local
async function loadCache() {
    return new Promise((resolve) => {
        chrome.storage.local.get('articleCache', (data) => {
            resolve(new Map(data.articleCache || []));
        });
    });
}

// Function to save the cache to chrome.storage.local
async function saveCache(cache) {
    const cacheArray = Array.from(cache.entries());
    return new Promise((resolve) => {
        chrome.storage.local.set({ articleCache: cacheArray }, () => {
            console.debug('Cache saved successfully.');
            resolve();
        });
    });
}

// Class for representing an article
class Article {
    constructor(element, title) {
        this.element = element;
        this.title = title;
    }
}

// Utility function to debounce a function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

module.exports = {
  loadCache,
  saveCache,
  Article,
  debounce
};