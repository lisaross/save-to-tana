// Content script - extracts content from the current page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'extractContent') {
    const options = request.options || {};
    
    try {
      // Extract page information
      const pageData = {
        url: window.location.href,
        title: document.title,
        content: ''
      };
      
      // Extract content if requested
      if (options.includeContent) {
        // Get main content - prioritize article content, then body
        const article = document.querySelector('article');
        const mainContent = article || document.body;
        
        // Extract text content, limiting to avoid exceeding API payload limits
        // Get first ~4000 characters to stay under the 5000 char limit with other metadata
        let content = mainContent.innerText;
        if (content.length > 4000) {
          content = content.substring(0, 4000) + '... (content truncated due to Tana API limits)';
        }
        
        pageData.content = content;
      }
      
      // If title is not requested, remove it
      if (!options.includeTitle) {
        delete pageData.title;
      }
      
      // Pre-sanitize content to avoid API errors
      if (pageData.title) {
        pageData.title = pageData.title.replace(/\r?\n|\r/g, ' ').trim();
      }
      
      if (pageData.content) {
        pageData.content = pageData.content.replace(/\r?\n|\r/g, ' ').trim();
      }
      
      sendResponse(pageData);
    } catch (error) {
      sendResponse({
        error: true,
        message: error.message || 'Unknown error occurred during content extraction'
      });
    }
  }
  
  // Must return true for asynchronous response
  return true;
});
