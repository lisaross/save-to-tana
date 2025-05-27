// Background script - handles API communication with Tana
chrome.runtime.onInstalled.addListener(function() {
  // No context menu needed since we removed the extractor
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

// Import the payload builder
import { buildTanaPayload } from './tanaPayloadBuilder.js';

// Function to save data to Tana
async function saveToTana(data) {
  try {
    console.log('Starting saveToTana with data:', data);
    
    // Get API key, target node ID, and schema info from storage
    const result = await new Promise(resolve => {
      chrome.storage.sync.get(['apiKey', 'targetNodeId', 'supertagId', 'tanaFieldIds'], resolve);
    });
    
    console.log('Retrieved configuration from storage:', result);
    console.log('apiKey:', result.apiKey);
    console.log('supertagId:', result.supertagId);
    console.log('targetNodeId:', result.targetNodeId);
    console.log('tanaFieldIds:', result.tanaFieldIds);
    
    if (!result.apiKey) {
      throw new Error('API Token not configured. Please go to extension options and set up your configuration.');
    }
    
    if (!result.supertagId) {
      throw new Error('Supertag ID not configured. Please extract and save your Tana schema in options.');
    }
    
    if (!result.targetNodeId) {
      throw new Error('Target Node ID is required. Please go to options and specify a target node ID.');
    }
    
    if (!result.tanaFieldIds) {
      throw new Error('Field IDs not configured. Please extract and save your Tana schema in options.');
    }
    
    const targetNodeId = result.targetNodeId;
    console.log('Using target node ID:', targetNodeId);
    
    // Build the payload using the schema
    const tanaPayload = buildTanaPayload(data, targetNodeId, result.supertagId, result.tanaFieldIds);
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

// Sanitize text for Tana API
function sanitizeText(text) {
  if (!text) return '';
  
  return text
    .replace(/\r?\n|\r/g, ' ')  // Replace newlines with spaces
    .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
    .trim();
}
