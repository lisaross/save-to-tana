document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-button');
  const statusDiv = document.getElementById('status');
  const openOptionsLink = document.getElementById('open-options');
  const includeContentCheckbox = document.getElementById('include-content');
  const includeTitleCheckbox = document.getElementById('include-title');
  const notConfiguredDiv = document.getElementById('not-configured');
  
  // Check if extension is configured
  chrome.storage.sync.get(['apiKey', 'supertagId', 'targetNodeId'], function(result) {
    if (!result.apiKey || !result.supertagId || !result.targetNodeId) {
      saveButton.disabled = true;
      notConfiguredDiv.style.display = 'block';
    }
  });
  
  // Open options page
  openOptionsLink.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  // Save to Tana button
  saveButton.addEventListener('click', function() {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    statusDiv.textContent = '';
    statusDiv.className = 'status';
    
    const options = {
      includeContent: includeContentCheckbox.checked,
      includeTitle: includeTitleCheckbox.checked
    };
    
    // Get the current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      
      // Extract content from the page
      chrome.tabs.sendMessage(currentTab.id, {
        action: 'extractContent',
        options: options
      }, function(response) {
        if (chrome.runtime.lastError) {
          showError('Error communicating with the page: ' + chrome.runtime.lastError.message);
          saveButton.disabled = false;
          saveButton.textContent = 'Save to Tana';
          return;
        }
        
        if (!response) {
          showError('No response from the page. Please refresh and try again.');
          saveButton.disabled = false;
          saveButton.textContent = 'Save to Tana';
          return;
        }
        
        if (response.error) {
          showError(response.message || 'Error extracting content from the page');
          saveButton.disabled = false;
          saveButton.textContent = 'Save to Tana';
          return;
        }
        
        // Send data to background script
        chrome.runtime.sendMessage({
          action: 'saveToTana',
          data: response
        }, function(result) {
          saveButton.disabled = false;
          saveButton.textContent = 'Save to Tana';
          
          if (!result) {
            showError('No response from the extension. Please try again.');
            return;
          }
          
          if (!result.success) {
            showError(result.error || 'Unknown error occurred');
            return;
          }
          
          showSuccess('Saved to Tana successfully!');
        });
      });
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
