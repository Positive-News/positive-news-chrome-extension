/**
 * @file googlenews.js
 * @author NicolasMICAUX
 * @contact micaux.nicolas@gmail.com
 */

const { classifyArticles, debouncedClassifyArticles } = require('./common.js');
let { countHidden } = require('./common.js');

/**
 * Hides a given article element.
 * On Google News, we also click the button "See fewer like this" when hiding the article, to help Google News algorithm understand our preferences.
 *
 * @param {HTMLElement} article - The article element to hide. Must be a valid DOM element.
 * @throws {Error} If `article` is null or undefined.
 */
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

/**
 * Tags a positive article by adding a small sunflower emoji.
 * @param {HTMLElement} article - The article element to tag. Must be a valid DOM element.
 * @throws {Error} If `article` is null or undefined.
 */
function tagPositiveArticle(article) {
    // Add a small 🌻 in the HTML just after <time> element on Google News
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

/**
 * Function to identify all articles on the page.
 * @returns {Map} A map where the keys are article titles and the values are the corresponding article elements.
 */
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

classifyArticles(findArticles, tagPositiveArticle, hideArticle);

// Set up a MutationObserver to listen for new article elements added to the DOM
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            const hasNewArticle = addedNodes.some(node => node.tagName === 'ARTICLE' || node.querySelector?.('article'));
            if (hasNewArticle) {
                debouncedClassifyArticles(findArticles, tagPositiveArticle, hideArticle);
            }
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });