// Options page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Get form elements
  const apiKeyInput = document.getElementById('apiKey');
  const targetNodeIdInput = document.getElementById('targetNodeId');
  const supertagIdInput = document.getElementById('supertagId');
  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('statusMessage');
  const tanaSchemaInput = document.getElementById('tanaSchema');
  const extractSchemaButton = document.getElementById('extractSchemaButton');
  const extractedFieldsDiv = document.getElementById('extractedFields');
  const extractedFieldIdsPre = document.getElementById('extractedFieldIds');
  const fieldIdUrlInput = document.getElementById('fieldIdUrl');
  const fieldIdAuthorInput = document.getElementById('fieldIdAuthor');
  const fieldIdDescriptionInput = document.getElementById('fieldIdDescription');
  const fieldIdContentInput = document.getElementById('fieldIdContent');
  
  // Load saved configuration
  loadConfiguration();
  
  // Add event listeners
  saveButton.addEventListener('click', saveConfiguration);
  extractSchemaButton.addEventListener('click', extractSchemaFromTextarea);
  
  // Function to load saved configuration
  function loadConfiguration() {
    chrome.storage.sync.get(['apiKey', 'supertagId', 'targetNodeId', 'tanaFieldIds'], function(result) {
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
      
      if (result.tanaFieldIds) {
        fieldIdUrlInput.value = result.tanaFieldIds.URL || '';
        fieldIdAuthorInput.value = result.tanaFieldIds.Author || '';
        fieldIdDescriptionInput.value = result.tanaFieldIds.Description || '';
        fieldIdContentInput.value = result.tanaFieldIds.Content || '';
      }
      
      validateForm();
    });
  }
  
  // Function to save configuration
  function saveConfiguration() {
    const apiKey = apiKeyInput.value.trim();
    const targetNodeId = targetNodeIdInput.value.trim();
    const supertagId = supertagIdInput.value.trim();
    const tanaFieldIds = {
      URL: fieldIdUrlInput.value.trim(),
      Author: fieldIdAuthorInput.value.trim(),
      Description: fieldIdDescriptionInput.value.trim(),
      Content: fieldIdContentInput.value.trim()
    };
    
    // Validate required fields
    if (!apiKey) {
      showToast('API Token is required', true);
      return;
    }
    
    if (!targetNodeId) {
      showToast('Target Node ID is required', true);
      return;
    }
    
    if (!supertagId) {
      showToast('Save to Tana Supertag ID is required. Please extract schema.', true);
      return;
    }
    
    if (!tanaFieldIds.URL || !tanaFieldIds.Author || !tanaFieldIds.Description || !tanaFieldIds.Content) {
      showToast('All field IDs are required.', true);
      return;
    }
    
    // Save configuration to storage
    chrome.storage.sync.set({
      apiKey: apiKey,
      targetNodeId: targetNodeId,
      supertagId: supertagId,
      tanaFieldIds: tanaFieldIds
    }, function() {
      showToast('Configuration saved successfully!');
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
  function showToast(message, isError = false) {
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast' + (isError ? ' error' : ' success') + ' show';
    setTimeout(() => {
      toast.className = 'toast' + (isError ? ' error' : ' success');
      toast.textContent = '';
    }, 5000);
  }
  
  // Add input event listeners for validation
  apiKeyInput.addEventListener('input', validateForm);
  targetNodeIdInput.addEventListener('input', validateForm);
  supertagIdInput.addEventListener('input', validateForm);
  fieldIdUrlInput.addEventListener('input', validateForm);
  fieldIdAuthorInput.addEventListener('input', validateForm);
  fieldIdDescriptionInput.addEventListener('input', validateForm);
  fieldIdContentInput.addEventListener('input', validateForm);
  
  // Function to extract schema from textarea
  function extractSchemaFromTextarea() {
    schemaErrorDiv.style.display = 'none';
    schemaErrorDiv.textContent = '';
    let raw = tanaSchemaInput.value;
    let schema;
    try {
      schema = JSON.parse(raw);
    } catch (e) {
      schemaErrorDiv.textContent = 'Could not parse JSON. Please paste the API payload as copied from Tana. Error: ' + e.message;
      schemaErrorDiv.style.display = 'block';
      extractedFieldsDiv.style.display = 'none';
      return;
    }
    // Extract supertagId and fieldIds from the JSON structure
    try {
      // Assume first node in nodes array
      const node = Array.isArray(schema.nodes) ? schema.nodes[0] : null;
      if (!node) throw new Error('No nodes found in schema payload.');
      // Extract supertagId
      const supertagId = node.supertags && node.supertags[0] && node.supertags[0].id ? node.supertags[0].id : '';
      supertagIdInput.value = supertagId;
      // Extract field IDs by name from children
      const fieldIds = {};
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          if (child.type === 'field' && child.attributeId) {
            if (child.children && child.children[0] && child.children[0].dataType === 'url') fieldIds['URL'] = child.attributeId;
            else if (fieldIds['Author'] === undefined) fieldIds['Author'] = child.attributeId;
            else if (fieldIds['Description'] === undefined) fieldIds['Description'] = child.attributeId;
            else fieldIds['Content'] = child.attributeId;
          }
        }
      }
      // Fill the inputs
      fieldIdUrlInput.value = fieldIds.URL || '';
      fieldIdAuthorInput.value = fieldIds.Author || '';
      fieldIdDescriptionInput.value = fieldIds.Description || '';
      fieldIdContentInput.value = fieldIds.Content || '';
      // Show extracted info as a labeled list
      extractedFieldsDiv.style.display = 'block';
      extractedFieldIdsPre.innerHTML =
        'Supertag ID: ' + supertagId + '\n' +
        Object.entries(fieldIds).map(([k, v]) => `${k} ID: ${v}`).join('\n');
      // Store in chrome.storage
      chrome.storage.sync.set({
        supertagId: supertagId,
        tanaFieldIds: fieldIds
      }, function() {
        showToast('Schema extracted and saved!');
      });
    } catch (e) {
      schemaErrorDiv.textContent = 'Failed to extract schema info: ' + e.message;
      schemaErrorDiv.style.display = 'block';
      extractedFieldsDiv.style.display = 'none';
    }
  }
  
  // Create schema error div
  const schemaErrorDiv = document.createElement('div');
  schemaErrorDiv.className = 'status error';
  schemaErrorDiv.style.display = 'none';
  tanaSchemaInput.parentNode.insertBefore(schemaErrorDiv, tanaSchemaInput.nextSibling);

  // Example JSON toggle logic
  const toggleBtn = document.getElementById('toggleExampleJson');
  const exampleJsonBlock = document.getElementById('exampleJsonBlock');
  const toggleLabel = document.getElementById('toggleExampleJsonLabel');

  if (toggleBtn && exampleJsonBlock && toggleLabel) {
    toggleBtn.addEventListener('click', () => {
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!expanded));
      exampleJsonBlock.style.display = expanded ? 'none' : 'block';
      toggleLabel.textContent = expanded ? 'Show Example JSON' : 'Hide Example JSON';
    });
  }
});

// --- TEST FUNCTION FOR SCHEMA CLEANING ---
function testSchemaCleaning() {
  const sample = `type Node = {
    name: string;
    description?: string;
    supertags: [{
      /* save-to-tana */
      id: 'R1RGcNI0g1ui'
    }];
    children: [
      {
        /* URL */
        type: 'field';
        attributeId: 'uhrM6T8Fw_cV';
        children: [{
          dataType: 'url';
          name: string;
        }];
      },
      {
        /* Author */
        type: 'field';
        attributeId: 'JFfGHKU_YHmO';
        children: Node[];
      },
      {
        /* Description */
        type: 'field';
        attributeId: 'T9BS_5h4EMQH';
        children: Node[];
      },
      {
        /* Content */
        type: 'field';
        attributeId: 'ErJaHS4DcnL-';
        children: Node[];
      },
    ];
  };`;
  let lines = sample.split('\n');
  if (lines[0].trim().startsWith('type')) lines.shift();
  if (lines[lines.length - 1].trim().replace(/[;\s]/g, '') === '}') lines.pop();
  let cleaned = lines
    .map(line => line
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/g, '')
      .replace(/^\s*\w+\??:.*;\s*$/g, '')
      .replace(/;/g, '')
      .replace(/\?/g, '')
      .replace(/'/g, '"')
      .trim()
    )
    .filter(line => line.length > 0)
    .join('\n');
  cleaned = cleaned.replace(/,\s*([\]\}])/g, '$1');
  cleaned = cleaned.replace(/(^|[,{\s])(\w+):/g, '$1"$2":');
  if (!cleaned.trim().startsWith('{')) cleaned = '{' + cleaned + '}';
  console.log('TEST Cleaned schema string:', cleaned);
  try {
    const parsed = JSON.parse(cleaned);
    console.log('TEST Parsed schema:', parsed);
  } catch (e) {
    console.error('TEST Parse error:', e.message);
  }
}
// Uncomment to run test
// testSchemaCleaning();
// --- END TEST FUNCTION ---
