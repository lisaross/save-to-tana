// Options page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Get form elements
  const apiKeyInput = document.getElementById('apiKey');
  const targetNodeIdInput = document.getElementById('targetNodeId');
  const supertagIdInput = document.getElementById('supertagId');
  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('statusMessage');
  
  // Load saved configuration
  loadConfiguration();
  
  // Add event listeners
  saveButton.addEventListener('click', saveConfiguration);
  
  // Function to load saved configuration
  function loadConfiguration() {
    chrome.storage.sync.get(['apiKey', 'supertagId', 'targetNodeId'], function(result) {
      console.log('Loaded configuration:', result);
      
      if (result.apiKey) {
        apiKeyInput.value = result.apiKey;
      }
      
      if (result.targetNodeId) {
        targetNodeIdInput.value = result.targetNodeId;
      }
      
      if (result.supertagId) {
        supertagIdInput.value = result.supertagId;
      }
      
      validateForm();
    });
  }
  
  // Function to save configuration
  function saveConfiguration() {
    const apiKey = apiKeyInput.value.trim();
    const targetNodeId = targetNodeIdInput.value.trim();
    const supertagId = supertagIdInput.value.trim();
    
    // Validate required fields
    if (!apiKey) {
      showStatus('API Token is required', true);
      return;
    }
    
    if (!targetNodeId) {
      showStatus('Target Node ID is required', true);
      return;
    }
    
    if (!supertagId) {
      showStatus('Save to Tana Supertag ID is required', true);
      return;
    }
    
    // Save configuration to storage
    chrome.storage.sync.set({
      apiKey: apiKey,
      targetNodeId: targetNodeId,
      supertagId: supertagId
    }, function() {
      showStatus('Configuration saved successfully!');
    });
  }
  
  // Function to validate the form
  function validateForm() {
    const apiKey = apiKeyInput.value.trim();
    const targetNodeId = targetNodeIdInput.value.trim();
    const supertagId = supertagIdInput.value.trim();
    
    // Enable save button if we have all required fields
    saveButton.disabled = !apiKey || !targetNodeId || !supertagId;
  }
  
  // Function to show status message
  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = isError ? 'status error' : 'status success';
    
    // Clear message after 5 seconds
    setTimeout(function() {
      statusMessage.textContent = '';
      statusMessage.className = 'status';
    }, 5000);
  }
  
  // Add input event listeners for validation
  apiKeyInput.addEventListener('input', validateForm);
  targetNodeIdInput.addEventListener('input', validateForm);
  supertagIdInput.addEventListener('input', validateForm);
});
