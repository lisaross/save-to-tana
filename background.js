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
      chrome.storage.sync.get(['apiKey', 'targetNodeId', 'tanaSupertagId', 'tanaFieldIds'], resolve);
    });
    
    console.log('Retrieved configuration from storage:', result);
    console.log('apiKey:', result.apiKey);
    console.log('tanaSupertagId:', result.tanaSupertagId);
    console.log('targetNodeId:', result.targetNodeId);
    console.log('tanaFieldIds:', result.tanaFieldIds);
    
    if (!result.apiKey) {
      throw new Error('API Token not configured. Please go to extension options and set up your configuration.');
    }
    
    if (!result.tanaSupertagId) {
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
    const tanaPayload = buildTanaPayload(data, targetNodeId, result.tanaSupertagId, result.tanaFieldIds);
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

// --- Chunking utility ---
/**
 * Splits content into chunks of up to maxSize characters, preserving paragraph and sentence boundaries when possible.
 * @param {string} content - The content to split.
 * @param {number} maxSize - Maximum size of each chunk.
 * @returns {string[]} Array of chunked strings.
 */
function splitIntoChunks(content, maxSize) {
  const paragraphs = content.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      if (paragraph.length > maxSize) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        for (const sentence of sentences) {
          if (sentence.length > maxSize) {
            for (let i = 0; i < sentence.length; i += maxSize) {
              chunks.push(sentence.slice(i, i + maxSize));
            }
          } else {
            if ((currentChunk + sentence).length > maxSize) {
              chunks.push(currentChunk);
              currentChunk = sentence;
            } else {
              currentChunk += sentence;
            }
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
}

// Sanitize text for Tana API
function sanitizeText(text) {
  if (!text) return '';
  
  return text
    .replace(/\r?\n|\r/g, ' ')  // Replace newlines with spaces
    .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
    .trim();
}
