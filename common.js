let countHidden = 0;

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

// Utility function to debounce a function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Article is an object with a HTML element and a title
async function classifyArticles(findArticles, tagPositiveArticle, hideArticle) {
    // Load the cache from storage
    const articleCache = await loadCache();
    console.debug('Article cache loaded:', articleCache);

    const articleMap = findArticles();
    const titlesToClassify = [];

    for (const [title, article] of articleMap.entries()) {
        // If article already hidden, skip it
        if (article.style.display === 'none') {
            console.debug('Article already hidden, skipping:', article);
            continue;
        }

        // Check if the title is already in the cache
        if (articleCache.has(title)) {
            const isPositive = articleCache.get(title);
            console.debug(`Title "${title}" found in cache with value:`, isPositive);

            if (isPositive) {
                tagPositiveArticle(article);
            } else {
                hideArticle(article);
            }
            continue;
        }

        // Add the title to the list for classification
        titlesToClassify.push(title);
    }

    if (titlesToClassify.length > 0) {
        console.debug('Titles to classify:', titlesToClassify);

        try {
            // Call the API with the list of article titles
            console.debug('Sending titles to API for classification...');
            const response = await fetch('https://classify-articles-176115608786.europe-west9.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ titles: titlesToClassify }),
            });

            const results = await response.json();
            console.debug('API response received:', results);

            // Process the API response
            results.forEach((isPositive, index) => {
                const title = titlesToClassify[index];
                console.debug(`Processing API result for title "${title}":`, isPositive);

                articleCache.set(title, isPositive);

                // If the article is not positive, hide it
                const article = articleMap.get(title);
                if (article) {
                    if (isPositive) {
                        tagPositiveArticle(article);
                    } else {
                        hideArticle(article);
                    }
                } else {
                    console.error(`Article element not found for title "${title}".`);
                }
            });

            // Save the updated cache to storage
            saveCache(articleCache);

        } catch (error) {
            console.error('Error classifying articles:', error);
        }
    } else {
        console.debug('No titles to classify.');
    }

    // Set the badge text to show the number of hidden articles
    chrome.runtime.sendMessage({ action: 'updateBadge', count: countHidden });
}

const debouncedClassifyArticles = debounce(classifyArticles, 300);

module.exports = {
  classifyArticles,
  debouncedClassifyArticles,
  countHidden
};