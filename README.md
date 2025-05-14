# Positive News 🌻 | Chrome Extension

Tired of doomscrolling through endless negativity?  🌻 Positive News clears your feed from negative news by using AI.  

**Our ambition is to be compatible with as much news websites as possible.**

## Looking for the download link?
- [Positive News 🌻 Chrome Extension](https://chromewebstore.google.com/detail/%F0%9F%8C%BB-positive-news/dmcobpljepileghpploeikbhmecmagpi)

## Your favorite news website is not yet supported? Contribute it
1) [Fork](https://docs.github.com/articles/fork-a-repo) this repository
2) Create a branch `new/name-of-the-website`
3) Inspire from `googlenews.js` to see what to implement to configure a new website:
  - `findArticles`: function to list all articles on a news webpage
  - `hideArticle`: function to hide an article when it's been marked as negative
  - `tagPositiveArticle`: function that shows that an article has been marked as positive (optional, you can leave the function empty)
  - (eventually, implement a `MutationObserver`, to detect when new articles have been loaded)
4) Add the relevant content script code into `manifest.json`
5) [Create a Pull-Request](https://docs.github.com/articles/creating-a-pull-request) whose title should be the website name. Document the PR as much as possible. Screenshots help me trust that the code indeed works ;)
_I will merge it when I feel it's good and redeploy the chrome extension :)_

## How to test?
1) Install dependencies: `npm install`  
2) Do your modifications
3) Build using `npm run build`. Code will end up in `dist` folder.
4) Import the extension in [chrome://extensions/](chrome://extensions/). Tutorial [here](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world).

## Want to discuss a topic?
- [Discussions about this specific Chrome extension](https://github.com/Positive-News/positive-news-extension/discussions)
- [Discussions about this whole project](https://github.com/orgs/Positive-News/discussions)

## Bug? Issue?
- [Report it here](https://github.com/Positive-News/positive-news-extension/issues). Be as descriptive as possible. Screenshots are appreciated.

## Licence
This work is distributed under AGPL.
