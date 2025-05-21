// Content script - extracts content from the current page with structure preservation
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'extractContent') {
    const options = request.options || {};
    
    try {
      // Extract page information
      const pageData = {
        url: window.location.href,
        title: document.title,
        structuredContent: []
      };
      
      // Extract content if requested
      if (options.includeContent) {
        // Get main content - prioritize article content, then main, then body
        const mainElement = document.querySelector('article') || 
                           document.querySelector('main') || 
                           document.querySelector('.main-content') || 
                           document.body;
        
        // Extract structured content
        if (options.preserveStructure) {
          pageData.structuredContent = extractStructuredContent(mainElement);
        } else {
          // Legacy flat content extraction
          let content = mainElement.innerText;
          if (content.length > 4000) {
            content = content.substring(0, 4000) + '... (content truncated due to Tana API limits)';
          }
          pageData.content = content.replace(/\r?\n|\r/g, ' ').trim();
        }
      }
      
      // If title is not requested, remove it
      if (!options.includeTitle) {
        delete pageData.title;
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

// Function to extract structured content from an element
function extractStructuredContent(element) {
  const structuredContent = [];
  const headerTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  
  // Get all direct children of the element
  const children = Array.from(element.children);
  
  // If no children or very few, process the element itself
  if (children.length < 3) {
    return processTextContent(element.innerText);
  }
  
  let currentSection = null;
  let currentParagraphs = [];
  
  // Process each child element
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const tagName = child.tagName;
    
    // Skip empty or invisible elements
    if (!child.innerText.trim() || child.offsetParent === null) {
      continue;
    }
    
    // If it's a header, start a new section
    if (headerTags.includes(tagName)) {
      // If we have a current section, add it to the result
      if (currentSection) {
        structuredContent.push({
          type: 'section',
          title: currentSection,
          content: currentParagraphs
        });
      }
      
      // Start a new section
      currentSection = sanitizeText(child.innerText);
      currentParagraphs = [];
    } 
    // If it's a paragraph or other content element
    else if (['P', 'DIV', 'SPAN', 'LI', 'UL', 'OL', 'BLOCKQUOTE'].includes(tagName)) {
      // If we don't have a current section, create a default one
      if (!currentSection) {
        currentSection = 'Content';
      }
      
      // Add paragraph to current section
      const text = sanitizeText(child.innerText);
      if (text) {
        currentParagraphs.push(text);
      }
    }
    // For other elements, recursively process them
    else if (child.children.length > 0) {
      const nestedContent = extractStructuredContent(child);
      if (nestedContent.length > 0) {
        // If we have a current section, add it first
        if (currentSection) {
          structuredContent.push({
            type: 'section',
            title: currentSection,
            content: currentParagraphs
          });
          currentSection = null;
          currentParagraphs = [];
        }
        
        // Add nested content
        structuredContent.push(...nestedContent);
      }
    }
  }
  
  // Add the last section if it exists
  if (currentSection) {
    structuredContent.push({
      type: 'section',
      title: currentSection,
      content: currentParagraphs
    });
  }
  
  // If no structured content was found, fall back to processing the text directly
  if (structuredContent.length === 0) {
    return processTextContent(element.innerText);
  }
  
  return structuredContent;
}

// Process plain text content
function processTextContent(text) {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Split by double newlines to separate paragraphs
  const paragraphs = text.split(/\n\s*\n/).map(p => sanitizeText(p)).filter(p => p);
  
  if (paragraphs.length === 0) {
    return [];
  }
  
  // Use the first paragraph as a title if it's short
  if (paragraphs[0].length < 100) {
    return [{
      type: 'section',
      title: paragraphs[0],
      content: paragraphs.slice(1)
    }];
  }
  
  // Otherwise, use a generic title
  return [{
    type: 'section',
    title: 'Content',
    content: paragraphs
  }];
}

// Sanitize text for Tana API
function sanitizeText(text) {
  if (!text) return '';
  
  return text
    .replace(/\r?\n|\r/g, ' ')  // Replace newlines with spaces
    .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
    .trim();
}
