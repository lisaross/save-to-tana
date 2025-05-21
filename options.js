document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const nodeIdInput = document.getElementById('node-id');
  const saveButton = document.getElementById('save-options');
  const statusDiv = document.getElementById('status');
  
  // Load saved options
  chrome.storage.sync.get(['apiKey', 'nodeId'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.nodeId) {
      nodeIdInput.value = result.nodeId;
    }
  });
  
  // Save options
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const nodeId = nodeIdInput.value.trim();
    
    if (!apiKey) {
      showError('API Token is required');
      return;
    }
    
    if (!nodeId) {
      showError('Node ID is required');
      return;
    }
    
    chrome.storage.sync.set({
      apiKey: apiKey,
      nodeId: nodeId
    }, function() {
      showSuccess('Options saved successfully!');
    });
  });
  
  function showSuccess(message) {
    statusDiv.textContent = message;
    statusDiv.className = 'status success';
    
    // Clear status after 3 seconds
    setTimeout(function() {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }
  
  function showError(message) {
    statusDiv.textContent = message;
    statusDiv.className = 'status error';
  }
});
