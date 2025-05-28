import { 
  SaveData, 
  SaveResponse, 
  TanaConfig, 
  SaveToTanaRequest,
  TanaPayload,
  TanaNodeChild,
  TanaNodeChildContent,
  ExtensionCommand
} from 'types';
import { buildTanaPayload } from './tanaPayloadBuilder';
import { chunkTanaPayload, getChunkingInfo } from './utils/payloadChunker';
import { validateTargetNodeId } from './utils/validators';

/**
 * Background script - handles API communication with Tana
 */

// No context menu needed since we removed the extractor
chrome.runtime.onInstalled.addListener(() => {
  console.log('Save to Tana extension installed');
});

// Handle keyboard shortcuts/commands
chrome.commands.onCommand.addListener((command: string) => {
  console.log('Command received:', command);
  
  const typedCommand = command as ExtensionCommand;
  
  switch (typedCommand) {
    case 'reload':
      handleReloadExtension();
      break;
    case 'open-popup':
      handleOpenPopup();
      break;
    default:
      console.log('Unknown command:', command);
  }
});

/**
 * Handle the reload extension command
 */
async function handleReloadExtension(): Promise<void> {
  try {
    console.log('Reloading extension...');
    
    // Close all extension pages (popup, options)
    const extensionTabs = await chrome.tabs.query({
      url: chrome.runtime.getURL('*')
    });
    
    for (const tab of extensionTabs) {
      if (tab.id) {
        await chrome.tabs.remove(tab.id);
      }
    }
    
    // Reload the extension
    chrome.runtime.reload();
  } catch (error) {
    console.error('Error reloading extension:', error);
  }
}

/**
 * Handle the open popup command
 */
async function handleOpenPopup(): Promise<void> {
  try {
    console.log('Opening popup...');
    
    // Get the current active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab?.id) {
      console.error('No active tab found');
      return;
    }
    
    // Open the popup by triggering the action
    chrome.action.openPopup();
  } catch (error) {
    console.error('Error opening popup:', error);
    
    // Fallback: try to open popup.html in a new tab
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('popup.html')
      });
    } catch (fallbackError) {
      console.error('Fallback popup opening failed:', fallbackError);
    }
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((
  request: SaveToTanaRequest, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response: SaveResponse) => void
) => {
  if (request.action === 'saveToTana') {
    saveToTana(request.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  return false;
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
    
    // Add hierarchical content nodes if available
    if (data.hierarchicalNodes && data.hierarchicalNodes.length > 0 && tanaPayload.nodes.length > 0) {
      // Include all content nodes - both hierarchical and flat
      const contentNodes = data.hierarchicalNodes[0].children || [];
      tanaPayload.nodes[0].children.push(...contentNodes);
      console.log('Added content nodes:', contentNodes.length);
    }
    
    // Check if we need to chunk the payload
    const payloadSize = JSON.stringify(tanaPayload).length;
    const needsChunking = payloadSize > 4500; // Conservative limit
    
    if (!needsChunking) {
      // Small payload - send as-is
      console.log(`Payload size: ${payloadSize} chars - sending as single request`);
      const responseData = await sendToTanaApi(tanaPayload, result.apiKey);
      
      return {
        success: true,
        data: responseData
      };
    }
    
    // Large payload - needs chunking with hierarchical approach
    console.log(`Large content detected (${payloadSize} chars). Using hierarchical chunking strategy.`);
    
    // First, create the main node with metadata only
    const mainNodePayload = buildTanaPayload(
      data, 
      targetNodeId, 
      result.supertagId, 
      result.tanaFieldIds
    );
    
    console.log('Sending main node with metadata...');
    const mainNodeResponse = await sendToTanaApi(mainNodePayload, result.apiKey);
    
    // Extract the created node ID from the response
    const createdNodeId = mainNodeResponse.children?.[0]?.nodeId;
    if (!createdNodeId) {
      throw new Error('Could not get node ID from main node creation response');
    }
    
    console.log(`Main node created with ID: ${createdNodeId}`);
    
    // Rate limiting: wait 1 second after creating main node before sending content chunks
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now chunk the hierarchical content and add as children to the main node
    if (data.hierarchicalNodes && data.hierarchicalNodes.length > 0) {
      const contentNodes = data.hierarchicalNodes[0].children || [];
      
      // Create a single payload with just the content (no wrapper node) and chunk it
      const contentPayload = {
        targetNodeId: createdNodeId,
        nodes: contentNodes.map((node: any) => ({
          name: ('name' in node ? node.name : 'Content') || 'Content',
          supertags: [] as { id: string }[],
          children: (node.children || []) as (TanaNodeChild | TanaNodeChildContent)[]
        }))
      };
      
      // Chunk the content payload
      const payloadChunks = chunkTanaPayload(contentPayload);
      
      console.log(`Chunked content into ${payloadChunks.length} parts`);
      
      // Send content chunks as children of the main node
      const contentResponses = [];
      for (let i = 0; i < payloadChunks.length; i++) {
        const chunk = payloadChunks[i];
        console.log(`Sending content chunk ${i + 1}/${payloadChunks.length} (${JSON.stringify(chunk).length} chars)`);
        
        try {
          const chunkResponse = await sendToTanaApi(chunk, result.apiKey);
          contentResponses.push(chunkResponse);
          
          // Rate limiting: wait 1.5 seconds between chunks to be extra safe
          if (i < payloadChunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.error(`Error sending content chunk ${i + 1}:`, error);
          
          // If it's a rate limit error, provide a helpful message
          if (error instanceof Error && error.message.includes('429')) {
            throw new Error(`Rate limit exceeded while sending chunk ${i + 1}/${payloadChunks.length}. Please wait a moment and try again.`);
          }
          
          throw new Error(`Failed to send content chunk ${i + 1}/${payloadChunks.length}: ${error}`);
        }
      }
      
      const responseData = {
        mainNode: mainNodeResponse,
        contentChunks: contentResponses.length,
        responses: [mainNodeResponse, ...contentResponses]
      };
      
      return {
        success: true,
        data: responseData
      };
    }
    
    // If no hierarchical content, just return the main node response
    const responseData = {
      mainNode: mainNodeResponse,
      contentChunks: 0,
      responses: [mainNodeResponse]
    };
    
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
          
          // Validate and extract target node ID
          const nodeIdValidation = validateTargetNodeId(result.targetNodeId);
          if (!nodeIdValidation.success) {
            reject(new Error(`Invalid target node ID: ${nodeIdValidation.error}`));
            return;
          }
          
          // Use the validated/extracted node ID
          const configWithValidatedNodeId = {
            ...result,
            targetNodeId: nodeIdValidation.nodeId!
          } as TanaConfig;
          
          resolve(configWithValidatedNodeId);
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
 * Send payload to Tana API with retry logic for rate limiting
 * @param payload - The payload to send
 * @param apiKey - The API key for authentication
 * @param retryCount - Current retry attempt (for internal use)
 * @returns Promise resolving to the API response data
 */
async function sendToTanaApi(payload: TanaPayload, apiKey: string, retryCount = 0): Promise<any> {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds base delay
  
  console.log(`Sending request to Tana API (attempt ${retryCount + 1})...`);
  
  try {
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
      
      // If it's a rate limit error and we haven't exceeded max retries, retry with exponential backoff
      if (response.status === 429 && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendToTanaApi(payload, apiKey, retryCount + 1);
      }
      
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('API success response:', responseData);
    return responseData;
  } catch (error) {
    // If it's a network error and we haven't exceeded max retries, retry
    if (retryCount < maxRetries && !(error instanceof Error && error.message.includes('API error'))) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`Network error. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendToTanaApi(payload, apiKey, retryCount + 1);
    }
    
    throw error;
  }
}
