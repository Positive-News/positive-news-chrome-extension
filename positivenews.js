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

// Function to hide an article element
function hideArticle(article) {
    if (article) {
        // Find button in the article to click
        const button = article.querySelector('button');
        if (button) {
            console.debug(`Clicking button in article`);
            button.click();
            // Now, find last <ul> element in whole webpage, then find last <li> element in that <ul> and click it
            const lastUl = document.querySelector('ul:last-of-type');
            if (lastUl) {
                const lastLi = lastUl.querySelector('li:last-of-type');
                if (lastLi) {
                    console.debug(`Clicking last <li> in the last <ul> element.`);
                    lastLi.click();
                } else {
                    console.warn(`No <li> found in the last <ul> element.`);
                }
            } else {
                console.warn(`No <ul> found in the document.`);
            }

            // Then, reclick the button to hide the "More" window
            button.click();
        } else {
            console.warn(`No button found in article.`);
        }
        console.debug(`Hiding article:`, article);
        article.style.display = 'none';
    }
}

async function classifyArticles() {  
    // Load the cache from storage
    const articleCache = await loadCache();
    console.debug('Article cache loaded:', articleCache);

    // Find all <article> elements on the page
    const articles = document.querySelectorAll('article');

    const titlesToClassify = [];
    const articleMap = new Map();

    for (const article of articles) {
        // If article already hidden, skip it
        if (article.style.display === 'none') {
            console.debug('Article already hidden, skipping:', article);
            continue;
        }
        // Find the first <a> element with non-empty text inside the article
        const links = article.querySelectorAll('a');
        const link = Array.from(links).find(a => a.textContent.trim() !== '');
        const title = link ? link.textContent.trim() : null;
        console.debug('Processing article:', { link, title });

        if (title) {
            // Check if the title is already in the cache
            if (articleCache.has(title)) {
                const isPositive = articleCache.get(title);
                console.debug(`Title "${title}" found in cache with value:`, isPositive);

                if (!isPositive) {
                    hideArticle(article);
                }
                continue;
            }

            // Add the title to the list for classification
            titlesToClassify.push(title);
            articleMap.set(title, article);
        } else {
            console.warn('Article does not have a valid title or link:', article);
        }
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
                if (!isPositive) {
                    const article = articleMap.get(title);
                    if (article) {
                        hideArticle(article);
                    } else {
                        console.error(`Article element not found for title "${title}".`);
                    }
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
}

classifyArticles();

// Utility function to debounce a function
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Debounced version of classifyArticles
const debouncedClassifyArticles = debounce(classifyArticles, 300);

// Set up a MutationObserver to listen for new article elements added to the DOM
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            const hasNewArticle = addedNodes.some(node => node.tagName === 'ARTICLE' || node.querySelector?.('article'));
            if (hasNewArticle) {
                debouncedClassifyArticles();
            }
        }
    }
});

// Start observing the document body for changes
observer.observe(document.body, { childList: true, subtree: true });