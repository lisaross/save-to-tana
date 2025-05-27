import { buildTanaPayload } from './tanaPayloadBuilder';
/**
 * Background script - handles API communication with Tana
 */
// No context menu needed since we removed the extractor
chrome.runtime.onInstalled.addListener(() => {
    console.log('Save to Tana extension installed');
});
// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
async function saveToTana(data) {
    try {
        console.log('Starting saveToTana with data:', data);
        // Get API key, target node ID, and schema info from storage
        const result = await getStorageConfig();
        console.log('Retrieved configuration from storage:', result);
        validateConfig(result);
        const targetNodeId = result.targetNodeId;
        console.log('Using target node ID:', targetNodeId);
        // Build the payload using the schema
        const tanaPayload = buildTanaPayload(data, targetNodeId, result.supertagId, result.tanaFieldIds);
        console.log('Formatted Tana payload:', tanaPayload);
        // Send data to Tana API
        const responseData = await sendToTanaApi(tanaPayload, result.apiKey);
        return {
            success: true,
            data: responseData
        };
    }
    catch (error) {
        console.error('Error saving to Tana:', error);
        throw error;
    }
}
/**
 * Get configuration from Chrome storage
 * @returns Promise resolving to TanaConfig
 */
async function getStorageConfig() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['apiKey', 'targetNodeId', 'supertagId', 'tanaFieldIds'], (result) => {
            try {
                validateConfig(result);
                resolve(result);
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
/**
 * Validate the configuration
 * @param config - The configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config) {
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
async function sendToTanaApi(payload, apiKey) {
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
//# sourceMappingURL=background.js.map