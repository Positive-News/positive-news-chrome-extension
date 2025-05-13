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
        chrome.storage.local.set({ articleCache: cacheArray }, resolve);
    });
}

async function classifyArticles() {
    // Load the cache from storage
    const articleCache = await loadCache();

    // Find all <article> elements on the page
    const articles = document.querySelectorAll('article');

    for (const article of articles) {
        // Find the first <a> element with non-empty text inside the article
        const link = article.querySelector('a');
        const title = link && link.textContent.trim();
        console.log('Article title:', title);

        if (title) {
            // Check if the title is already in the cache
            if (articleCache.has(title)) {
                const isPositive = articleCache.get(title);
                if (!isPositive) {
                    article.style.display = 'none';
                }
                continue;
            }

            try {
                // Call the API with the article title
                const response = await fetch('https://classify-article-176115608786.us-central1.run.app', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title }),
                });

                const result = await response.json();
                console.log('API response:', result);

                // If the API response contains "positive", store it in the cache
                if ('positive' in result) {
                    articleCache.set(title, result.positive);

                    // Save the updated cache to storage
                    await saveCache(articleCache);

                    // If the article is not positive, hide it
                    if (!result.positive) {
                        article.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error classifying article:', error);
            }
        }
    }
}

// Run the function when the page loads
document.addEventListener('DOMContentLoaded', classifyArticles);