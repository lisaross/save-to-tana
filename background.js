// Background script - handles API communication with Tana
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
    // Get API key and node ID from storage
    const result = await new Promise(resolve => {
      chrome.storage.sync.get(['apiKey', 'nodeId'], resolve);
    });
    
    if (!result.apiKey) {
      throw new Error('API Token not configured');
    }
    
    if (!result.nodeId) {
      throw new Error('Node ID not configured');
    }
    
    // Format data for Tana API
    const tanaPayload = formatTanaPayload(data, result.nodeId);
    
    // Send data to Tana API
    const response = await fetch('https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.apiKey}`
      },
      body: JSON.stringify(tanaPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const responseData = await response.json();
    return {
      success: true,
      data: responseData
    };
  } catch (error) {
    console.error('Error saving to Tana:', error);
    throw error;
  }
}

// Format data for Tana API
function formatTanaPayload(data, nodeId) {
  // Create node name from title or URL, sanitizing to remove newlines
  let nodeName = data.title || data.url;
  
  // Sanitize node name - remove newlines as they're not allowed by Tana API
  nodeName = nodeName.replace(/\r?\n|\r/g, ' ').trim();
  
  // Create children nodes for URL and content
  const children = [];
  
  // Add URL as a child node
  children.push({
    name: "URL",
    children: [
      {
        dataType: "url",
        name: data.url
      }
    ]
  });
  
  // Add content as a child node if it exists
  if (data.content) {
    // Sanitize content - ensure it doesn't have formatting that would break Tana
    const sanitizedContent = data.content
      .replace(/\r?\n|\r/g, ' ')  // Replace newlines with spaces
      .trim();
      
    children.push({
      name: "Content",
      children: [
        {
          name: sanitizedContent
        }
      ]
    });
  }
  
  // Create the payload
  return {
    targetNodeId: nodeId,
    nodes: [
      {
        name: nodeName,
        children: children
      }
    ]
  };
}
