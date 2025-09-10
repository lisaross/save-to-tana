import { 
  SaveData, 
  SaveResponse, 
  TanaConfig, 
  ExtensionRequest,
  SaveToTanaRequest,
  ExtractContentRequest,
  InjectOverlayRequest,
  QuickSaveRequest,
  SaveWithNotesRequest,
  TanaPayload
} from './types/index';
import { buildTanaPayload } from './tanaPayloadBuilder';

/**
 * Background script - handles API communication with Tana and orchestrates extension events
 */

// Extension installation and setup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Save to Tana extension installed');
  await setupContextMenus();
});

// Omnibox integration - handles "tana" keyword searches
chrome.omnibox.onInputStarted.addListener(() => {
  console.log('Omnibox input started for Save to Tana');
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  // Provide search suggestions based on input
  const suggestions = [];
  
  if (text.trim() === '') {
    // Empty input - suggest quick save
    suggestions.push({
      content: 'quick-save',
      description: 'Quick save current page'
    });
  } else {
    // User typed something - suggest save with custom title
    suggestions.push({
      content: `save:${text}`,
      description: `Save current page with title: "${text}"`
    });
    suggestions.push({
      content: `quick:${text}`,
      description: `Quick save current page (ignore text)`
    });
  }
  
  suggest(suggestions);
});

chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;

  if (text === 'quick-save' || text.trim() === '') {
    // Quick save for empty input or explicit quick-save
    await handleQuickSave(activeTab.id);
  } else if (text.startsWith('save:')) {
    // Save with custom title
    const customTitle = text.substring(5).trim();
    if (customTitle) {
      await handleSaveWithCustomTitle(activeTab.id, customTitle);
    } else {
      // Empty title after "save:" - do quick save
      await handleQuickSave(activeTab.id);
    }
  } else if (text.startsWith('quick:')) {
    // Quick save (ignoring any text after "quick:")
    await handleQuickSave(activeTab.id);
  } else {
    // User typed plain text - save with that as custom title
    await handleSaveWithCustomTitle(activeTab.id, text.trim());
  }
});

// Keyboard command handlers
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command received: ${command}`);
  
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;

  switch (command) {
    case 'quick-save':
      await handleQuickSave(activeTab.id);
      break;
    case 'save-with-notes':
      await handleSaveWithNotes(activeTab.id);
      break;
    default:
      console.log(`Unknown command: ${command}`);
  }
});

// Context menu event handlers
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case 'save-page':
      await handleQuickSave(tab.id);
      break;
    case 'save-with-notes':
      await handleSaveWithNotes(tab.id);
      break;
    case 'save-selection':
      if (info.selectionText) {
        await handleSaveSelection(tab.id, info.selectionText);
      }
      break;
    default:
      console.log(`Unknown context menu item: ${info.menuItemId}`);
  }
});

// Enhanced message handler for all extension communication
chrome.runtime.onMessage.addListener((
  request: ExtensionRequest, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response: SaveResponse | any) => void
) => {
  console.log(`Message received: ${request.action}`, request);

  switch (request.action) {
    case 'saveToTana':
      handleSaveToTanaMessage(request as SaveToTanaRequest, sendResponse);
      return true; // Async response

    case 'extractContent':
      // This is handled by content script, but we can log it
      console.log('Extract content request forwarded to content script');
      return false;

    case 'injectOverlay':
      handleInjectOverlay(request as InjectOverlayRequest, sendResponse);
      return true; // Async response

    case 'quickSave':
      handleQuickSaveMessage(request as QuickSaveRequest, sendResponse);
      return true; // Async response

    case 'saveWithNotes':
      handleSaveWithNotesMessage(request as SaveWithNotesRequest, sendResponse);
      return true; // Async response


    default:
      console.log(`Unknown message action: ${request.action}`);
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

/**
 * Function to save data to Tana
 * @param data - The data to save to Tana
 * @returns Promise resolving to a SaveResponse
 */
async function saveToTana(data: SaveData): Promise<SaveResponse> {
  try {
    console.log('Starting saveToTana with data:', data);
    
    // Get API key, target node ID, and schema info from storage
    const result = await getStorageConfig();
    
    console.log('Retrieved configuration from storage:', result);
    validateConfig(result);
    
    const targetNodeId = result.targetNodeId;
    console.log('Using target node ID:', targetNodeId);
    
    // Build the payload using the schema
    const tanaPayload = buildTanaPayload(
      data, 
      targetNodeId, 
      result.supertagId, 
      result.tanaFieldIds
    );
    console.log('Formatted Tana payload:', tanaPayload);
    
    // Send data to Tana API
    const responseData = await sendToTanaApi(tanaPayload, result.apiKey);
    
    return {
      success: true,
      data: responseData
    };
  } catch (error) {
    console.error('Error saving to Tana:', error);
    throw error;
  }
}

/**
 * Get configuration from Chrome storage
 * @returns Promise resolving to TanaConfig
 */
async function getStorageConfig(): Promise<TanaConfig> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(
      ['apiKey', 'targetNodeId', 'supertagId', 'tanaFieldIds'], 
      (result) => {
        try {
          validateConfig(result);
          resolve(result as TanaConfig);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Validate the configuration
 * @param config - The configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: Partial<TanaConfig>): asserts config is TanaConfig {
  if (!config.apiKey) {
    throw new Error('API Token not configured. Please go to extension options and set up your configuration.');
  }
  
  if (!config.supertagId) {
    throw new Error('Supertag ID not configured. Please extract and save your Tana schema in options.');
  }
  
  if (!config.targetNodeId) {
    throw new Error('Target Node ID is required. Please go to options and specify a target node ID.');
  }
  
  if (!config.tanaFieldIds) {
    throw new Error('Field IDs not configured. Please extract and save your Tana schema in options.');
  }
}

/**
 * Send payload to Tana API
 * @param payload - The payload to send
 * @param apiKey - The API key for authentication
 * @returns Promise resolving to the API response data
 */
async function sendToTanaApi(payload: TanaPayload, apiKey: string): Promise<any> {
  console.log('Sending request to Tana API...');
  const response = await fetch('https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  
  console.log('API response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API error response:', errorText);
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  
  const responseData = await response.json();
  console.log('API success response:', responseData);
  return responseData;
}

// ===== Event Handler Functions =====

/**
 * Setup context menus for the extension
 */
async function setupContextMenus(): Promise<void> {
  try {
    // Remove all existing context menus first
    await chrome.contextMenus.removeAll();

    // Create main context menu items
    chrome.contextMenus.create({
      id: 'save-page',
      title: 'Save page to Tana',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'save-with-notes',
      title: 'Save page to Tana with notes',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'save-selection',
      title: 'Save selection to Tana',
      contexts: ['selection']
    });

    console.log('Context menus created successfully');
  } catch (error) {
    console.error('Error setting up context menus:', error);
  }
}

/**
 * Handle saveToTana message (maintains backward compatibility)
 */
async function handleSaveToTanaMessage(
  request: SaveToTanaRequest, 
  sendResponse: (response: SaveResponse) => void
): Promise<void> {
  try {
    const result = await saveToTana(request.data);
    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Handle overlay injection requests
 */
async function handleInjectOverlay(
  request: InjectOverlayRequest,
  sendResponse: (response: SaveResponse) => void
): Promise<void> {
  try {
    // Inject content script if not already present
    await chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      files: ['content.js']
    });

    // You could also inject overlay-specific scripts here
    // await chrome.scripting.executeScript({
    //   target: { tabId: request.tabId },
    //   files: ['overlay.js']
    // });

    sendResponse({ success: true });
  } catch (error) {
    console.error('Error injecting overlay:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to inject overlay'
    });
  }
}

/**
 * Handle quick save requests from messages
 */
async function handleQuickSaveMessage(
  request: QuickSaveRequest,
  sendResponse: (response: SaveResponse) => void
): Promise<void> {
  try {
    const result = await performQuickSave(request.tabId);
    sendResponse(result);
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Quick save failed'
    });
  }
}

/**
 * Handle save with notes requests from messages
 */
async function handleSaveWithNotesMessage(
  request: SaveWithNotesRequest,
  sendResponse: (response: SaveResponse) => void
): Promise<void> {
  try {
    // For save with notes, we need to open the popup or overlay
    // This will typically be handled by injecting an overlay content script
    await handleInjectOverlay({ action: 'injectOverlay', tabId: request.tabId }, (response) => {
      if (response.success) {
        // Send message to the tab to show the notes dialog
        chrome.tabs.sendMessage(request.tabId, {
          action: 'showNotesDialog'
        });
      }
    });
    
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Save with notes failed'
    });
  }
}


/**
 * Handle quick save from keyboard shortcut or context menu
 */
async function handleQuickSave(tabId: number): Promise<void> {
  try {
    const result = await performQuickSave(tabId);
    
    // Show notification to user
    if (result.success) {
      showNotification('Page saved to Tana successfully!', 'success');
    } else {
      showNotification(result.error || 'Save failed', 'error');
    }
  } catch (error) {
    console.error('Quick save error:', error);
    showNotification('Quick save failed', 'error');
  }
}

/**
 * Handle save with notes from keyboard shortcut or context menu
 */
async function handleSaveWithNotes(tabId: number): Promise<void> {
  try {
    // Inject overlay for notes dialog
    await handleInjectOverlay({ action: 'injectOverlay', tabId }, (response) => {
      if (response.success) {
        // Send message to show notes dialog
        chrome.tabs.sendMessage(tabId, {
          action: 'showNotesDialog'
        });
      } else {
        showNotification('Failed to open notes dialog', 'error');
      }
    });
  } catch (error) {
    console.error('Save with notes error:', error);
    showNotification('Failed to open notes dialog', 'error');
  }
}

/**
 * Handle save with custom title from omnibox
 */
async function handleSaveWithCustomTitle(tabId: number, customTitle: string): Promise<void> {
  try {
    // Extract content first
    const pageData = await extractPageContent(tabId);
    if (pageData) {
      // Override the title with custom title
      pageData.title = customTitle;
      const result = await saveToTana(pageData);
      
      if (result.success) {
        showNotification(`Page saved to Tana with title: "${customTitle}"`, 'success');
      } else {
        showNotification(result.error || 'Save failed', 'error');
      }
    }
  } catch (error) {
    console.error('Save with custom title error:', error);
    showNotification('Save with custom title failed', 'error');
  }
}

/**
 * Handle saving selected text
 */
async function handleSaveSelection(tabId: number, selectionText: string): Promise<void> {
  try {
    // Get basic page data and combine with selection
    const pageData = await extractPageContent(tabId, { includeContent: false });
    if (pageData) {
      // Use selection as content
      pageData.content = selectionText;
      pageData.title = `Selection from ${pageData.title}`;
      
      const result = await saveToTana(pageData);
      
      if (result.success) {
        showNotification('Selection saved to Tana successfully!', 'success');
      } else {
        showNotification(result.error || 'Save failed', 'error');
      }
    }
  } catch (error) {
    console.error('Save selection error:', error);
    showNotification('Save selection failed', 'error');
  }
}

/**
 * Perform quick save operation
 */
async function performQuickSave(tabId: number): Promise<SaveResponse> {
  try {
    const pageData = await extractPageContent(tabId);
    if (!pageData) {
      throw new Error('Failed to extract page content');
    }
    
    return await saveToTana(pageData);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Quick save failed'
    };
  }
}

/**
 * Extract page content from a tab
 */
async function extractPageContent(
  tabId: number, 
  options: { includeContent?: boolean; includeTitle?: boolean } = {}
): Promise<SaveData | null> {
  return new Promise((resolve) => {
    const extractOptions = {
      includeContent: options.includeContent ?? true,
      includeTitle: options.includeTitle ?? true
    };

    chrome.tabs.sendMessage(
      tabId,
      { action: 'extractContent', options: extractOptions },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Content extraction error:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        
        if (response && !response.error) {
          resolve({
            url: response.url,
            title: response.title,
            author: response.author,
            description: response.description,
            content: response.content
          });
        } else {
          console.error('Content extraction failed:', response?.message);
          resolve(null);
        }
      }
    );
  });
}

/**
 * Show notification to user
 */
function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
  const notificationId = `tana-${Date.now()}`;
  
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'images/icon48.png',
    title: 'Save to Tana',
    message: message
  });

  // Auto-clear notification after 3 seconds
  setTimeout(() => {
    chrome.notifications.clear(notificationId);
  }, 3000);
}
