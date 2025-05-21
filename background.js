// Background script - handles API communication with Tana
chrome.runtime.onInstalled.addListener(function() {
  // Create context menu item for Tana pages
  chrome.contextMenus.create({
    id: "extractTanaConfig",
    title: "Extract Save to Tana Configuration",
    contexts: ["page"],
    documentUrlPatterns: ["https://app.tana.inc/*"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "extractTanaConfig") {
    chrome.tabs.sendMessage(tab.id, { action: 'extractTanaConfiguration' }, function(response) {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        return;
      }
      
      if (!response || !response.success) {
        console.error('Failed to extract configuration:', response ? response.error : 'No response');
        return;
      }
      
      // Configuration extracted successfully
      console.log('Configuration extracted:', response.config);
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'saveToTana') {
    saveToTana(request.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message || 'Unknown error occurred'
        });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

// Function to save data to Tana
async function saveToTana(data) {
  try {
    console.log('Starting saveToTana with data:', data);
    
    // Get API key, target node ID, supertag ID, and field IDs from storage
    const result = await new Promise(resolve => {
      chrome.storage.sync.get(['apiKey', 'supertagId', 'fieldIds', 'targetNodeId'], resolve);
    });
    
    console.log('Retrieved configuration from storage:', result);
    
    if (!result.apiKey) {
      throw new Error('API Token not configured. Please go to extension options and set up your configuration.');
    }
    
    if (!result.supertagId || !result.fieldIds) {
      throw new Error('Extension not fully configured. Please go to options and paste configuration from Tana.');
    }
    
    if (!result.targetNodeId) {
      throw new Error('Target Node ID is required. Please go to options and specify a target node ID.');
    }
    
    const targetNodeId = result.targetNodeId;
    console.log('Using target node ID:', targetNodeId);
    
    // Format data for Tana API
    const tanaPayload = formatTanaPayload(data, targetNodeId, result.supertagId, result.fieldIds);
    console.log('Formatted Tana payload:', tanaPayload);
    
    // Send data to Tana API
    console.log('Sending request to Tana API...');
    const response = await fetch('https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.apiKey}`
      },
      body: JSON.stringify(tanaPayload)
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('API success response:', responseData);
    
    return {
      success: true,
      data: responseData
    };
  } catch (error) {
    console.error('Error saving to Tana:', error);
    throw error;
  }
}

// Format data for Tana API with parent nodes for each field instead of structured fields
function formatTanaPayload(data, targetNodeId, supertagId, fieldIds) {
  // Create node name from title or URL, sanitizing to remove newlines
  let nodeName = data.title || data.url;
  
  // Sanitize node name - remove newlines as they're not allowed by Tana API
  nodeName = nodeName.replace(/\r?\n|\r/g, ' ').trim();
  
  // Create the main node with supertag
  const mainNode = {
    name: nodeName,
    supertags: [
      {
        id: supertagId
      }
    ],
    children: []
  };
  
  // Add URL as a child node (not a field)
  if (data.url) {
    mainNode.children.push({
      name: `URL: ${data.url}`
    });
  }
  
  // Add Author as a child node (not a field)
  if (data.author) {
    mainNode.children.push({
      name: `Author: ${sanitizeText(data.author)}`
    });
  }
  
  // Add Description as a child node (not a field)
  if (data.description) {
    mainNode.children.push({
      name: `Description: ${sanitizeText(data.description)}`
    });
  }
  
  // Add Content as a child node (not a field)
  if (data.content) {
    // Sanitize content - ensure it doesn't have formatting that would break Tana
    const sanitizedContent = sanitizeText(data.content);
    
    // Limit content length to avoid API limits
    const maxContentLength = 4000; // Safe limit to stay under Tana's 5000 character payload limit
    const truncatedContent = sanitizedContent.length > maxContentLength 
      ? sanitizedContent.substring(0, maxContentLength) + '... (content truncated due to length)'
      : sanitizedContent;
    
    mainNode.children.push({
      name: `Content: ${truncatedContent}`
    });
  }
  
  // Create the payload
  return {
    targetNodeId: targetNodeId,
    nodes: [mainNode]
  };
}

// Sanitize text for Tana API
function sanitizeText(text) {
  if (!text) return '';
  
  return text
    .replace(/\r?\n|\r/g, ' ')  // Replace newlines with spaces
    .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
    .trim();
}
