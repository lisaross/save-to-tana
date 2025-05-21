// Options page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const supertagIdInput = document.getElementById('supertag-id');
  const urlFieldIdInput = document.getElementById('url-field-id');
  const authorFieldIdInput = document.getElementById('author-field-id');
  const descriptionFieldIdInput = document.getElementById('description-field-id');
  const contentFieldIdInput = document.getElementById('content-field-id');
  const targetNodeIdInput = document.getElementById('target-node-id');
  const configJsonTextarea = document.getElementById('config-json');
  const parseConfigButton = document.getElementById('parse-config');
  const saveButton = document.getElementById('save-options');
  const resetButton = document.getElementById('reset-options');
  const statusDiv = document.getElementById('status');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Show selected tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
          content.classList.add('active');
        }
      });
    });
  });
  
  // Load saved options
  loadOptions();
  
  // Parse configuration button
  parseConfigButton.addEventListener('click', function() {
    const configJson = configJsonTextarea.value.trim();
    
    if (!configJson) {
      showError('Please paste the configuration JSON first');
      return;
    }
    
    try {
      const config = JSON.parse(configJson);
      console.log('Parsed configuration:', config);
      
      // Validate configuration
      if (!config.supertagId) {
        showError('Invalid configuration: Missing supertag ID');
        return;
      }
      
      if (!config.fieldIds || !config.fieldIds.URL || !config.fieldIds.Author || 
          !config.fieldIds.Description || !config.fieldIds.Content) {
        showError('Invalid configuration: Missing field IDs');
        return;
      }
      
      // Populate fields with parsed data
      supertagIdInput.value = config.supertagId;
      urlFieldIdInput.value = config.fieldIds.URL;
      authorFieldIdInput.value = config.fieldIds.Author;
      descriptionFieldIdInput.value = config.fieldIds.Description;
      contentFieldIdInput.value = config.fieldIds.Content;
      
      // If target node ID was found, populate it (but don't override existing value)
      if (config.targetNodeId && !targetNodeIdInput.value) {
        targetNodeIdInput.value = config.targetNodeId;
      }
      
      // Switch to manual tab to show the parsed values
      document.querySelector('[data-tab="manual-config"]').click();
      
      showSuccess('Configuration parsed successfully!');
    } catch (error) {
      showError('Invalid JSON format: ' + error.message);
    }
  });
  
  // Save options
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const supertagId = supertagIdInput.value.trim();
    const urlFieldId = urlFieldIdInput.value.trim();
    const authorFieldId = authorFieldIdInput.value.trim();
    const descriptionFieldId = descriptionFieldIdInput.value.trim();
    const contentFieldId = contentFieldIdInput.value.trim();
    const targetNodeId = targetNodeIdInput.value.trim();
    
    if (!apiKey) {
      showError('API Token is required');
      return;
    }
    
    if (!supertagId) {
      showError('Supertag ID is required. Please paste and parse the configuration first.');
      return;
    }
    
    if (!urlFieldId || !authorFieldId || !descriptionFieldId || !contentFieldId) {
      showError('All field IDs are required. Please paste and parse the configuration first.');
      return;
    }
    
    if (!targetNodeId) {
      showError('Target Node ID is required. Please specify where content should be saved.');
      return;
    }
    
    chrome.storage.sync.set({
      apiKey: apiKey,
      supertagId: supertagId,
      fieldIds: {
        URL: urlFieldId,
        Author: authorFieldId,
        Description: descriptionFieldId,
        Content: contentFieldId
      },
      targetNodeId: targetNodeId,
      lastUpdated: new Date().toISOString()
    }, function() {
      console.log('Saved configuration:', {
        apiKey: '***REDACTED***',
        supertagId: supertagId,
        fieldIds: {
          URL: urlFieldId,
          Author: authorFieldId,
          Description: descriptionFieldId,
          Content: contentFieldId
        },
        targetNodeId: targetNodeId
      });
      showSuccess('Options saved successfully!');
    });
  });
  
  // Reset options
  resetButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all settings?')) {
      chrome.storage.sync.clear(function() {
        apiKeyInput.value = '';
        supertagIdInput.value = '';
        urlFieldIdInput.value = '';
        authorFieldIdInput.value = '';
        descriptionFieldIdInput.value = '';
        contentFieldIdInput.value = '';
        targetNodeIdInput.value = '';
        configJsonTextarea.value = '';
        showSuccess('All settings have been reset.');
      });
    }
  });
  
  // Load options from storage
  function loadOptions() {
    chrome.storage.sync.get(['apiKey', 'supertagId', 'fieldIds', 'targetNodeId', 'lastUpdated'], function(result) {
      console.log('Loaded configuration:', {
        apiKey: result.apiKey ? '***REDACTED***' : undefined,
        supertagId: result.supertagId,
        fieldIds: result.fieldIds,
        targetNodeId: result.targetNodeId
      });
      
      if (result.apiKey) {
        apiKeyInput.value = result.apiKey;
      }
      
      if (result.supertagId) {
        supertagIdInput.value = result.supertagId;
      }
      
      if (result.fieldIds) {
        urlFieldIdInput.value = result.fieldIds.URL || '';
        authorFieldIdInput.value = result.fieldIds.Author || '';
        descriptionFieldIdInput.value = result.fieldIds.Description || '';
        contentFieldIdInput.value = result.fieldIds.Content || '';
      }
      
      if (result.targetNodeId) {
        targetNodeIdInput.value = result.targetNodeId;
      }
    });
  }
  
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
