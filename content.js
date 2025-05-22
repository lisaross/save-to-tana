// Content script - extracts content from the current page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'extractContent') {
    const options = request.options || {};
    
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
        // Get main content - prioritize article content, then main, then body
        const mainElement = document.querySelector('article') || 
                           document.querySelector('main') || 
                           document.querySelector('.main-content') || 
                           document.body;
        
        // Extract content
        let content = mainElement.innerText;
        // Remove the 4000-character truncation. Optionally, cap at 100000 characters.
        if (content.length > 100000) {
          content = content.substring(0, 100000) + '... (content truncated due to very large page)';
        }
        pageData.content = content;
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
    } catch (error) {
      console.error('Content extraction error:', error);
      sendResponse({
        error: true,
        message: error.message || 'Unknown error occurred during content extraction'
      });
    }
  }
  
  // Must return true for asynchronous response
  return true;
});

// Extract author from meta tags
function extractAuthor() {
  // Try various meta tags that might contain author information
  const authorMeta = document.querySelector('meta[name="author"], meta[property="article:author"], meta[name="twitter:creator"], meta[property="og:site_name"]');
  if (authorMeta) {
    return authorMeta.getAttribute('content');
  }
  
  // Try schema.org markup
  const schemaAuthor = document.querySelector('[itemtype*="schema.org/Person"] [itemprop="name"], [itemtype*="schema.org/Organization"] [itemprop="name"]');
  if (schemaAuthor) {
    return schemaAuthor.textContent;
  }
  
  // Try byline classes commonly used
  const bylineElement = document.querySelector('.byline, .author, .article-author');
  if (bylineElement) {
    return bylineElement.textContent;
  }
  
  return '';
}

// Extract description from meta tags
function extractDescription() {
  // Try various meta tags that might contain description
  const descMeta = document.querySelector('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]');
  if (descMeta) {
    return descMeta.getAttribute('content');
  }
  
  return '';
}
