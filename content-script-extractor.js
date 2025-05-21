// Content script for extracting nodeIDs from Tana configuration node
(() => {
  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractTanaConfiguration') {
      try {
        const config = extractTanaConfiguration();
        sendResponse({ success: true, config });
      } catch (error) {
        console.error('Error extracting Tana configuration:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Unknown error occurred during extraction' 
        });
      }
    }
    // Return true to indicate we will send a response asynchronously
    return true;
  });

  // Add context menu extraction button to Tana nodes with save-to-tana supertag
  function addExtractionButtons() {
    // Only run on Tana pages
    if (!document.location.href.includes('app.tana.inc')) {
      return;
    }

    // Look for nodes with save-to-tana supertag
    const supertagElements = document.querySelectorAll('[data-tag="save-to-tana"]');
    
    supertagElements.forEach(element => {
      // Find the closest node container
      const nodeContainer = findClosestNodeContainer(element);
      if (!nodeContainer) return;
      
      // Check if we already added a button to this node
      const existingButton = nodeContainer.querySelector('.save-to-tana-extract-button');
      if (existingButton) return;
      
      // Find the menu area to add our button
      const menuArea = findMenuArea(nodeContainer);
      if (!menuArea) return;
      
      // Create extraction button
      const extractButton = document.createElement('button');
      extractButton.className = 'save-to-tana-extract-button navtarget Button-module_button__7zRTD Button-module_transparent__T5ICN Button-module_smaller__JrVDS Button-module_neutral__F5-0Z';
      extractButton.setAttribute('data-intro-transition', 'true');
      extractButton.setAttribute('aria-label', 'Extract Save to Tana Configuration');
      extractButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1ZM0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z" fill="currentColor"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M8 3.5C8.27614 3.5 8.5 3.72386 8.5 4V8C8.5 8.27614 8.27614 8.5 8 8.5C7.72386 8.5 7.5 8.27614 7.5 8V4C7.5 3.72386 7.72386 3.5 8 3.5Z" fill="currentColor"/>
          <path d="M8.75 10.5C8.75 10.9142 8.41421 11.25 8 11.25C7.58579 11.25 7.25 10.9142 7.25 10.5C7.25 10.0858 7.58579 9.75 8 9.75C8.41421 9.75 8.75 10.0858 8.75 10.5Z" fill="currentColor"/>
        </svg>
      `;
      
      // Add click event listener
      extractButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          const config = extractTanaConfiguration();
          
          // Format as JSON string for easy copying
          const configJson = JSON.stringify(config, null, 2);
          
          // Copy to clipboard
          await navigator.clipboard.writeText(configJson);
          
          // Show success message
          showToast('Configuration extracted and copied to clipboard!');
        } catch (error) {
          console.error('Error extracting configuration:', error);
          showToast('Error: ' + (error.message || 'Failed to extract configuration'), true);
        }
      });
      
      // Add button to menu area
      menuArea.appendChild(extractButton);
    });
  }

  // Show a toast notification
  function showToast(message, isError = false) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '10000';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '500';
    
    if (isError) {
      toast.style.backgroundColor = '#fee2e2';
      toast.style.color = '#b91c1c';
    } else {
      toast.style.backgroundColor = '#dcfce7';
      toast.style.color = '#166534';
    }
    
    toast.textContent = message;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }

  // Find menu area in node container
  function findMenuArea(nodeContainer) {
    // Look for the menu area or a place to insert our button
    return nodeContainer.querySelector('[data-role="editable-wrapper"] span:last-child') || 
           nodeContainer.querySelector('.wrapEditableAndMenu span:last-child');
  }

  // Function to extract Tana configuration from the page
  function extractTanaConfiguration() {
    // Check if we're on a Tana page
    if (!document.location.href.includes('app.tana.inc')) {
      throw new Error('This is not a Tana page. Please open Tana and navigate to your configuration node.');
    }

    // Find the save-to-tana supertag
    const supertagElement = document.querySelector('[data-tag="save-to-tana"]');
    if (!supertagElement) {
      throw new Error('Could not find #save-to-tana supertag on this page. Please make sure you are viewing a node with this supertag applied.');
    }

    // Extract the supertag ID
    const supertagId = supertagElement.getAttribute('data-tag-id');
    if (!supertagId) {
      throw new Error('Could not extract the ID for #save-to-tana supertag.');
    }

    // Find field elements - they are typically in tuple elements with locked names
    const fieldIds = {};
    const fieldElements = document.querySelectorAll('.editable.lockedName');
    
    console.log('Found field elements:', fieldElements.length);
    
    // Process each field
    for (const element of fieldElements) {
      const fieldName = element.textContent.trim();
      
      // Only process our specific fields
      if (['URL', 'Author', 'Description', 'Content'].includes(fieldName)) {
        console.log(`Found field: ${fieldName}`);
        
        // Get the wrapper element that contains the field ID
        const wrapperElement = element.closest('[data-editable-wrapper="true"]');
        if (wrapperElement && wrapperElement.id) {
          // Extract the last part of the ID (after the last pipe)
          const idParts = wrapperElement.id.split('|');
          const fieldId = idParts[idParts.length - 1];
          
          if (fieldId) {
            fieldIds[fieldName] = fieldId;
            console.log(`Extracted field ID for ${fieldName}: ${fieldId}`);
          }
        }
      }
    }

    console.log('Extracted field IDs:', fieldIds);

    // Check if we found all required fields
    const requiredFields = ['URL', 'Author', 'Description', 'Content'];
    const missingFields = requiredFields.filter(field => !fieldIds[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Could not find the following fields: ${missingFields.join(', ')}. Please make sure your configuration node has all required fields.`);
    }

    // Get the target node ID (the node with the supertag)
    const nodeElement = findClosestNodeContainer(supertagElement);
    const targetNodeId = nodeElement ? nodeElement.getAttribute('id') : null;

    return {
      supertagId,
      fieldIds,
      targetNodeId,
      timestamp: new Date().toISOString()
    };
  }

  // Helper function to find the closest node container
  function findClosestNodeContainer(element) {
    let current = element;
    while (current) {
      if (current.hasAttribute('id') && current.id.includes('|')) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  // Run when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addExtractionButtons);
  } else {
    addExtractionButtons();
  }

  // Also run periodically to catch dynamically added nodes
  setInterval(addExtractionButtons, 2000);
})();
