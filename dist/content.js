"use strict";
/**
 * Content script - extracts content from the current page
 */
// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        const options = request.options || { includeContent: true, includeTitle: true };
        try {
            // Extract page information
            const pageData = {
                url: window.location.href,
                title: document.title,
                author: extractAuthor(),
                description: extractDescription(),
                content: ''
            };
            // Extract content if requested
            if (options.includeContent) {
                pageData.content = extractMainContent();
            }
            // If title is not requested, use URL as title
            if (!options.includeTitle || !pageData.title) {
                pageData.title = pageData.url;
            }
            // Pre-sanitize title to avoid API errors
            if (pageData.title) {
                pageData.title = pageData.title.replace(/\r?\n|\r/g, ' ').trim();
            }
            sendResponse(pageData);
        }
        catch (error) {
            console.error('Content extraction error:', error);
            sendResponse({
                url: window.location.href,
                title: document.title,
                author: '',
                description: '',
                content: '',
                error: true,
                message: error instanceof Error ? error.message : 'Unknown error occurred during content extraction'
            });
        }
    }
    // Must return true for asynchronous response
    return true;
});
/**
 * Extract the main content from the page
 * @returns The main content text
 */
function extractMainContent() {
    // Get main content - prioritize article content, then main, then body
    const mainElement = document.querySelector('article') ||
        document.querySelector('main') ||
        document.querySelector('.main-content') ||
        document.body;
    if (!mainElement) {
        return '';
    }
    // Extract content
    let content = mainElement.innerText;
    // Cap at 100000 characters to prevent excessive data transfer
    const MAX_CONTENT_LENGTH = 100000;
    if (content.length > MAX_CONTENT_LENGTH) {
        content = content.substring(0, MAX_CONTENT_LENGTH) +
            '... (content truncated due to very large page)';
    }
    return content;
}
/**
 * Extract author from meta tags and common page elements
 * @returns The extracted author or empty string if not found
 */
function extractAuthor() {
    // Try various meta tags that might contain author information
    const authorSelectors = [
        'meta[name="author"]',
        'meta[property="article:author"]',
        'meta[name="twitter:creator"]',
        'meta[property="og:site_name"]'
    ];
    for (const selector of authorSelectors) {
        const metaTag = document.querySelector(selector);
        if (metaTag && metaTag.getAttribute('content')) {
            return metaTag.getAttribute('content') || '';
        }
    }
    // Try schema.org markup
    const schemaSelectors = [
        '[itemtype*="schema.org/Person"] [itemprop="name"]',
        '[itemtype*="schema.org/Organization"] [itemprop="name"]'
    ];
    for (const selector of schemaSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
            return element.textContent.trim();
        }
    }
    // Try byline classes commonly used
    const bylineSelectors = ['.byline', '.author', '.article-author'];
    for (const selector of bylineSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
            return element.textContent.trim();
        }
    }
    return '';
}
/**
 * Extract description from meta tags
 * @returns The extracted description or empty string if not found
 */
function extractDescription() {
    // Try various meta tags that might contain description
    const descriptionSelectors = [
        'meta[name="description"]',
        'meta[property="og:description"]',
        'meta[name="twitter:description"]'
    ];
    for (const selector of descriptionSelectors) {
        const metaTag = document.querySelector(selector);
        if (metaTag && metaTag.getAttribute('content')) {
            return metaTag.getAttribute('content') || '';
        }
    }
    return '';
}
//# sourceMappingURL=content.js.map