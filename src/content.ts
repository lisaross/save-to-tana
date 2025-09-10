/**
 * Content script interfaces
 */
interface ExtractOptions {
  includeContent: boolean;
  includeTitle: boolean;
}

interface ExtractRequest {
  action: 'extractContent';
  options: ExtractOptions;
}

interface ShowNotesDialogRequest {
  action: 'showNotesDialog';
}


interface PageData {
  url: string;
  title: string;
  author: string;
  description: string;
  content: string;
  error?: boolean;
  message?: string;
}

type ContentScriptRequest = ExtractRequest | ShowNotesDialogRequest;

/**
 * Content script - extracts content from the current page
 */

/**
 * Global state for overlay management
 */
let overlayElement: HTMLElement | null = null;
let currentPageData: PageData | null = null;

// Listen for messages from the popup and background script
chrome.runtime.onMessage.addListener((
  request: ContentScriptRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) => {
  console.log('Content script received message:', request.action);

  if (request.action === 'extractContent') {
    const options = request.options || { includeContent: true, includeTitle: true };
    
    try {
      // Extract page information
      const pageData: PageData = {
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
    } catch (error) {
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

  if (request.action === 'showNotesDialog') {
    try {
      // Extract current page data
      const pageData: PageData = {
        url: window.location.href,
        title: document.title,
        author: extractAuthor(),
        description: extractDescription(),
        content: extractMainContent()
      };
      
      currentPageData = pageData;
      showOverlay(pageData);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error showing notes dialog:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to show notes dialog' 
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
function extractMainContent(): string {
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
function extractAuthor(): string {
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
function extractDescription(): string {
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

/**
 * Show the quick capture overlay
 */
function showOverlay(pageData: PageData): void {
  try {
    // Remove existing overlay if present
    hideOverlay();

    // Create overlay container
    overlayElement = document.createElement('div');
    overlayElement.id = 'tana-save-overlay';
    
    // Apply overlay styles and HTML
    overlayElement.innerHTML = getOverlayHTML(pageData);
    
    // Inject overlay styles
    injectOverlayStyles();
    
    // Add to DOM - ensure we have a body element
    if (!document.body) {
      console.error('Cannot show overlay: document.body is not available');
      return;
    }
    
    document.body.appendChild(overlayElement);
    
    // Set up event listeners
    setupOverlayEventListeners();
    
    // Focus on the notes textarea
    setTimeout(() => {
      const notesTextarea = overlayElement?.querySelector('#tana-notes-input') as HTMLTextAreaElement;
      if (notesTextarea) {
        notesTextarea.focus();
      }
    }, 100);
    
    console.log('Tana overlay shown successfully');
  } catch (error) {
    console.error('Error showing overlay:', error);
    // Clean up on error
    hideOverlay();
  }
}

/**
 * Hide the quick capture overlay
 */
function hideOverlay(): void {
  if (overlayElement) {
    // Clean up event listeners
    document.removeEventListener('keydown', handleOverlayKeydown, true);
    
    overlayElement.remove();
    overlayElement = null;
    currentPageData = null;
  }
  
  // Also remove the styles element
  const styleElement = document.getElementById('tana-overlay-styles');
  if (styleElement) {
    styleElement.remove();
  }
}

/**
 * Generate the overlay HTML
 */
function getOverlayHTML(pageData: PageData): string {
  const truncatedTitle = pageData.title.length > 60 
    ? pageData.title.substring(0, 60) + '...' 
    : pageData.title;
    
  const truncatedUrl = pageData.url.length > 50 
    ? pageData.url.substring(0, 50) + '...' 
    : pageData.url;

  return `
    <div class="tana-overlay-backdrop">
      <div class="tana-overlay-dialog">
        <div class="tana-overlay-header">
          <h2>Save to Tana</h2>
          <button type="button" class="tana-overlay-close" id="tana-close-overlay">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M13.5 4.5l-9 9M4.5 4.5l9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="tana-overlay-content">
          <div class="tana-overlay-preview">
            <div class="tana-overlay-page-info">
              <div class="tana-overlay-page-title">${escapeHtml(truncatedTitle)}</div>
              <div class="tana-overlay-page-url">${escapeHtml(truncatedUrl)}</div>
            </div>
          </div>
          
          <div class="tana-overlay-notes-section">
            <label for="tana-notes-input" class="tana-overlay-label">
              Add notes (optional)
            </label>
            <textarea 
              id="tana-notes-input" 
              class="tana-overlay-notes-input" 
              placeholder="Add your notes here..."
              rows="4"
            ></textarea>
          </div>
          
          <div class="tana-overlay-actions">
            <button type="button" class="tana-overlay-button tana-overlay-button-secondary" id="tana-cancel-save">
              Cancel
            </button>
            <button type="button" class="tana-overlay-button tana-overlay-button-primary" id="tana-confirm-save">
              Save to Tana
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Inject CSS styles for the overlay
 */
function injectOverlayStyles(): void {
  // Check if styles are already injected
  if (document.getElementById('tana-overlay-styles')) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'tana-overlay-styles';
  styleElement.textContent = `
    #tana-save-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Liberation Sans", Arial, sans-serif !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      color: #c9d1d9 !important;
      box-sizing: border-box !important;
      pointer-events: auto !important;
    }
    
    #tana-save-overlay * {
      box-sizing: border-box !important;
    }
    
    .tana-overlay-backdrop {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.8) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      box-sizing: border-box !important;
    }
    
    .tana-overlay-dialog {
      background: #161b22 !important;
      border: 1px solid #30363d !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
      width: 100% !important;
      max-width: 540px !important;
      max-height: 90vh !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      position: relative !important;
    }
    
    .tana-overlay-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 20px 24px 16px 24px !important;
      border-bottom: 1px solid #30363d !important;
      background: #0d1117 !important;
    }
    
    .tana-overlay-header h2 {
      margin: 0 !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      color: #f0f6fc !important;
    }
    
    .tana-overlay-close {
      background: transparent !important;
      border: none !important;
      color: #8b949e !important;
      cursor: pointer !important;
      padding: 8px !important;
      border-radius: 6px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s !important;
      margin: 0 !important;
    }
    
    .tana-overlay-close:hover {
      background: #21262d !important;
      color: #f0f6fc !important;
    }
    
    .tana-overlay-content {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 24px !important;
    }
    
    .tana-overlay-preview {
      margin-bottom: 20px !important;
      padding: 16px !important;
      background: #0d1117 !important;
      border: 1px solid #30363d !important;
      border-radius: 8px !important;
    }
    
    .tana-overlay-page-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 6px !important;
    }
    
    .tana-overlay-page-title {
      font-weight: 600 !important;
      color: #f0f6fc !important;
      font-size: 15px !important;
      line-height: 1.4 !important;
    }
    
    .tana-overlay-page-url {
      color: #8b949e !important;
      font-size: 13px !important;
      word-break: break-all !important;
    }
    
    .tana-overlay-notes-section {
      margin-bottom: 24px !important;
    }
    
    .tana-overlay-label {
      display: block !important;
      margin-bottom: 8px !important;
      font-weight: 500 !important;
      color: #c9d1d9 !important;
      font-size: 14px !important;
    }
    
    .tana-overlay-notes-input {
      width: 100% !important;
      background: #0d1117 !important;
      color: #c9d1d9 !important;
      border: 1px solid #30363d !important;
      border-radius: 6px !important;
      padding: 12px !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      font-family: inherit !important;
      resize: vertical !important;
      min-height: 100px !important;
      box-sizing: border-box !important;
      transition: border-color 0.2s !important;
    }
    
    .tana-overlay-notes-input:focus {
      outline: none !important;
      border-color: #8b949e !important;
      box-shadow: 0 0 0 2px rgba(139, 148, 158, 0.3) !important;
    }
    
    .tana-overlay-notes-input::placeholder {
      color: #6e7681 !important;
    }
    
    .tana-overlay-actions {
      display: flex !important;
      gap: 12px !important;
      justify-content: flex-end !important;
    }
    
    .tana-overlay-button {
      border: none !important;
      border-radius: 6px !important;
      padding: 8px 16px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      font-family: inherit !important;
      line-height: 1.5 !important;
      margin: 0 !important;
    }
    
    .tana-overlay-button-secondary {
      background: #21262d !important;
      color: #f0f6fc !important;
      border: 1px solid #30363d !important;
    }
    
    .tana-overlay-button-secondary:hover {
      background: #30363d !important;
      border-color: #8b949e !important;
    }
    
    .tana-overlay-button-primary {
      background: #238636 !important;
      color: #ffffff !important;
      border: 1px solid #238636 !important;
    }
    
    .tana-overlay-button-primary:hover {
      background: #2ea043 !important;
      border-color: #2ea043 !important;
    }
    
    .tana-overlay-button-primary:disabled {
      background: #21262d !important;
      color: #6e7681 !important;
      border-color: #30363d !important;
      cursor: not-allowed !important;
    }
    
    /* Toast notifications */
    .tana-overlay-toast {
      position: fixed !important;
      top: 24px !important;
      right: 24px !important;
      background: #21262d !important;
      color: #f0f6fc !important;
      border: 1px solid #30363d !important;
      border-radius: 8px !important;
      padding: 12px 16px !important;
      font-size: 14px !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
      z-index: 2147483648 !important;
      opacity: 0 !important;
      transform: translateY(-8px) !important;
      transition: all 0.3s ease !important;
      pointer-events: none !important;
      font-family: inherit !important;
      max-width: 320px !important;
    }
    
    .tana-overlay-toast.show {
      opacity: 1 !important;
      transform: translateY(0) !important;
      pointer-events: auto !important;
    }
    
    .tana-overlay-toast.success {
      background: #1a7f37 !important;
      color: #ffffff !important;
      border-color: #238636 !important;
    }
    
    .tana-overlay-toast.error {
      background: #b62324 !important;
      color: #ffffff !important;
      border-color: #da3633 !important;
    }
    
    /* Responsive adjustments */
    @media (max-width: 600px) {
      .tana-overlay-backdrop {
        padding: 12px !important;
      }
      
      .tana-overlay-dialog {
        max-width: 100% !important;
        margin: 0 !important;
      }
      
      .tana-overlay-content {
        padding: 20px !important;
      }
      
      .tana-overlay-actions {
        flex-direction: column !important;
        gap: 8px !important;
      }
      
      .tana-overlay-button {
        width: 100% !important;
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}

/**
 * Set up event listeners for overlay interactions
 */
function setupOverlayEventListeners(): void {
  if (!overlayElement) return;

  try {
    // Close overlay handlers
    const closeButton = overlayElement.querySelector('#tana-close-overlay');
    const cancelButton = overlayElement.querySelector('#tana-cancel-save');
    const backdrop = overlayElement.querySelector('.tana-overlay-backdrop');

    if (closeButton) {
      closeButton.addEventListener('click', hideOverlay);
    }
    
    if (cancelButton) {
      cancelButton.addEventListener('click', hideOverlay);
    }
    
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          hideOverlay();
        }
      });
    }

    // Save button handler
    const saveButton = overlayElement.querySelector('#tana-confirm-save');
    if (saveButton) {
      saveButton.addEventListener('click', handleSaveFromOverlay);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleOverlayKeydown, true);
  } catch (error) {
    console.error('Error setting up overlay event listeners:', error);
  }
}

/**
 * Handle save action from overlay
 */
function handleSaveFromOverlay(): void {
  if (!currentPageData || !overlayElement) return;

  const notesInput = overlayElement.querySelector('#tana-notes-input') as HTMLTextAreaElement;
  const notes = notesInput ? notesInput.value.trim() : '';

  // Combine notes with content if provided
  let finalContent = currentPageData.content;
  if (notes) {
    finalContent = notes + '\n\n' + finalContent;
  }

  const saveData = {
    ...currentPageData,
    content: finalContent,
    notes
  };

  // Disable save button
  const saveButton = overlayElement.querySelector('#tana-confirm-save') as HTMLButtonElement;
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
  }

  // Send save request
  chrome.runtime.sendMessage({
    action: 'saveToTana',
    data: saveData
  }, (response) => {
    if (response && response.success) {
      hideOverlay();
      showToast('Page saved to Tana successfully!', 'success');
    } else {
      // Re-enable save button on error
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save to Tana';
      }
      showToast(response?.error || 'Save failed', 'error');
    }
  });
}

/**
 * Handle keyboard shortcuts in overlay
 */
function handleOverlayKeydown(e: KeyboardEvent): void {
  if (!overlayElement) return;

  // Escape key closes overlay
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    hideOverlay();
  }

  // Ctrl/Cmd + Enter saves
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    handleSaveFromOverlay();
  }
}

/**
 * Show a toast notification
 */
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  // Remove existing toast
  const existingToast = document.querySelector('.tana-overlay-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `tana-overlay-toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 3000);
}

/**
 * Escape HTML characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Clean up overlay when page unloads
 */
window.addEventListener('beforeunload', () => {
  hideOverlay();
  document.removeEventListener('keydown', handleOverlayKeydown, true);
});
