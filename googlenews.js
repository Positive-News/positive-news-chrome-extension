const { loadCache, saveCache, Article, debounce } = require('./common.js');

let countHidden = 0;

// Function to hide an article element
function hideArticle(article) {
    if (article) {
        countHidden++;
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

// Function to show that an article is positive and was kept by PositiveNews
function tagPositiveArticle(article) {
    // Add a small 🌻 in the HTML just after <time> element
    const timeElement = article.querySelector('time');
    if (timeElement) {
        const sunflowerEmoji = document.createElement('span');
        sunflowerEmoji.textContent = '🌻';
        sunflowerEmoji.title = 'This article was selected by PositiveNews 🌻'; // Add tooltip
        timeElement.parentNode.insertBefore(sunflowerEmoji, timeElement.nextSibling);
    } else {
        console.warn(`No <time> element found in article.`);
    }
}

// Function to identify all articles on the page
function findArticles() {
    const articles = document.querySelectorAll('article');
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
        
        if (title) {
            articleMap.set(title, article);
        } else {
            console.warn('Article does not have a valid title or link:', article);
        }
    }

    return articleMap;
}

// Article is an object with a HTML element and a title
async function classifyArticles() {
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

classifyArticles();

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

observer.observe(document.body, { childList: true, subtree: true });