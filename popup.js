document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-button');
  const statusDiv = document.getElementById('status');
  const openOptionsLink = document.getElementById('open-options');
  const includeContentCheckbox = document.getElementById('include-content');
  const includeTitleCheckbox = document.getElementById('include-title');
  const preserveStructureCheckbox = document.getElementById('preserve-structure');
  
  // Check if API key and node ID are configured
  chrome.storage.sync.get(['apiKey', 'nodeId'], function(result) {
    if (!result.apiKey || !result.nodeId) {
      saveButton.disabled = true;
      statusDiv.textContent = 'Please configure your API key and Node ID first';
      statusDiv.className = 'status error';
    }
  });
  
  // Open options page
  openOptionsLink.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  // Save to Tana button click handler
  saveButton.addEventListener('click', function() {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    statusDiv.textContent = '';
    statusDiv.className = 'status';
    
    const options = {
      includeContent: includeContentCheckbox.checked,
      includeTitle: includeTitleCheckbox.checked,
      preserveStructure: preserveStructureCheckbox.checked
    };
    
    // Get the current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      
      // Send message to content script to extract page content
      chrome.tabs.sendMessage(currentTab.id, {action: 'extractContent', options: options}, function(response) {
        if (chrome.runtime.lastError) {
          showError('Error extracting content: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (!response) {
          showError('No response from content script');
          return;
        }
        
        // Check for error in content script response
        if (response.error) {
          showError('Error extracting content: ' + response.message);
          return;
        }
        
        // Send data to background script to save to Tana
        chrome.runtime.sendMessage({
          action: 'saveToTana',
          data: response
        }, function(result) {
          if (chrome.runtime.lastError) {
            showError('Error saving to Tana: ' + chrome.runtime.lastError.message);
            return;
          }
          
          if (result.success) {
            showSuccess('Saved to Tana successfully!');
          } else {
            showError('Error: ' + result.error);
          }
        });
      });
    });
  });
  
  function showSuccess(message) {
    statusDiv.textContent = message;
    statusDiv.className = 'status success';
    saveButton.disabled = false;
    saveButton.textContent = 'Save to Tana';
  }
  
  function showError(message) {
    statusDiv.textContent = message;
    statusDiv.className = 'status error';
    saveButton.disabled = false;
    saveButton.textContent = 'Save to Tana';
  }
});
