import { TanaConfig, TanaFieldIds } from './types';
import { validateTargetNodeId } from './utils/validators';

/**
 * Options page interfaces
 */
interface SchemaParseResult {
  supertagId: string;
  fieldIds: TanaFieldIds;
}

/**
 * Options page controller
 */
export class OptionsController {
  // Form elements
  private apiKeyInput: HTMLInputElement;
  private targetNodeIdInput: HTMLInputElement;
  private supertagIdInput: HTMLInputElement;
  private saveButton: HTMLButtonElement;
  private tanaSchemaInput: HTMLTextAreaElement;
  private extractSchemaButton: HTMLButtonElement;
  private extractedFieldsDiv: HTMLDivElement;
  private extractedFieldIdsPre: HTMLPreElement;
  private fieldIdUrlInput: HTMLInputElement;
  private fieldIdAuthorInput: HTMLInputElement;
  private fieldIdDescriptionInput: HTMLInputElement;
  private fieldIdContentInput: HTMLInputElement;
  private schemaErrorDiv: HTMLDivElement;
  private toast: HTMLDivElement | null = null;

  /**
   * Initialize the options page controller
   */
  constructor() {
    console.log('OptionsController constructor started');
    
    // Get form elements
    this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    this.targetNodeIdInput = document.getElementById('targetNodeId') as HTMLInputElement;
    this.supertagIdInput = document.getElementById('supertagId') as HTMLInputElement;
    this.saveButton = document.getElementById('saveButton') as HTMLButtonElement;
    this.tanaSchemaInput = document.getElementById('tanaSchema') as HTMLTextAreaElement;
    this.extractSchemaButton = document.getElementById('extractSchemaButton') as HTMLButtonElement;
    this.extractedFieldsDiv = document.getElementById('extractedFields') as HTMLDivElement;
    this.extractedFieldIdsPre = document.getElementById('extractedFieldIds') as HTMLPreElement;
    this.fieldIdUrlInput = document.getElementById('fieldIdUrl') as HTMLInputElement;
    this.fieldIdAuthorInput = document.getElementById('fieldIdAuthor') as HTMLInputElement;
    this.fieldIdDescriptionInput = document.getElementById('fieldIdDescription') as HTMLInputElement;
    this.fieldIdContentInput = document.getElementById('fieldIdContent') as HTMLInputElement;
    this.toast = document.getElementById('toast') as HTMLDivElement;
    
    // Debug log to check if elements were found
    console.log('Extract schema button found:', !!this.extractSchemaButton);
    console.log('Tana schema textarea found:', !!this.tanaSchemaInput);
    console.log('All elements found:', {
      apiKeyInput: !!this.apiKeyInput,
      targetNodeIdInput: !!this.targetNodeIdInput,
      supertagIdInput: !!this.supertagIdInput,
      saveButton: !!this.saveButton,
      tanaSchemaInput: !!this.tanaSchemaInput,
      extractSchemaButton: !!this.extractSchemaButton,
      extractedFieldsDiv: !!this.extractedFieldsDiv,
      extractedFieldIdsPre: !!this.extractedFieldIdsPre,
      toast: !!this.toast
    });
    
    // Create schema error div
    this.schemaErrorDiv = document.createElement('div');
    this.schemaErrorDiv.className = 'status error';
    this.schemaErrorDiv.style.display = 'none';
    this.tanaSchemaInput.parentNode?.insertBefore(this.schemaErrorDiv, this.tanaSchemaInput.nextSibling);
    
    // Initialize the page
    this.initializePage();
  }

  /**
   * Initialize the options page
   */
  private initializePage(): void {
    console.log('Initializing options page...');
    
    // Load saved configuration
    this.loadConfiguration();
    
    // Add event listeners
    this.saveButton.addEventListener('click', this.saveConfiguration.bind(this));
    this.extractSchemaButton.addEventListener('click', () => {
      console.log('Extract schema button clicked!');
      this.extractSchemaFromTextarea();
    });
    
    // Add input event listeners for validation
    this.apiKeyInput.addEventListener('input', this.validateForm.bind(this));
    this.targetNodeIdInput.addEventListener('input', this.validateForm.bind(this));
    this.supertagIdInput.addEventListener('input', this.validateForm.bind(this));
    this.fieldIdUrlInput.addEventListener('input', this.validateForm.bind(this));
    this.fieldIdAuthorInput.addEventListener('input', this.validateForm.bind(this));
    this.fieldIdDescriptionInput.addEventListener('input', this.validateForm.bind(this));
    this.fieldIdContentInput.addEventListener('input', this.validateForm.bind(this));
    
    // Initialize example JSON toggle
    this.initializeExampleJsonToggle();
    
    console.log('Options page initialization complete');
  }

  /**
   * Initialize the example JSON toggle
   */
  private initializeExampleJsonToggle(): void {
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
  }

  /**
   * Load saved configuration from storage
   */
  private loadConfiguration(): void {
    chrome.storage.sync.get(
      ['apiKey', 'supertagId', 'targetNodeId', 'tanaFieldIds'], 
      (result: Partial<TanaConfig>) => {
        console.log('Loaded configuration:', result);
        
        if (result.apiKey) {
          this.apiKeyInput.value = result.apiKey;
        }
        
        if (result.targetNodeId) {
          this.targetNodeIdInput.value = result.targetNodeId;
        }
        
        if (result.supertagId) {
          this.supertagIdInput.value = result.supertagId;
        }
        
        if (result.tanaFieldIds) {
          this.fieldIdUrlInput.value = result.tanaFieldIds.URL || '';
          this.fieldIdAuthorInput.value = result.tanaFieldIds.Author || '';
          this.fieldIdDescriptionInput.value = result.tanaFieldIds.Description || '';
          // Content field is commented out - using hierarchical content instead
        }
        
        this.validateForm();
      }
    );
  }

  /**
   * Save configuration to storage
   */
  private saveConfiguration(): void {
    const rawTargetNodeId = this.targetNodeIdInput.value.trim();
    const supertagId = this.supertagIdInput.value.trim();
    const tanaFieldIds: TanaFieldIds = {
      URL: this.fieldIdUrlInput.value.trim(),
      Author: this.fieldIdAuthorInput.value.trim(),
      Description: this.fieldIdDescriptionInput.value.trim(),
      // Content field is commented out - using hierarchical content instead
    };
    
    // Validate and extract target node ID
    const nodeIdValidation = validateTargetNodeId(rawTargetNodeId);
    if (!nodeIdValidation.success) {
      this.showToast(nodeIdValidation.error || 'Invalid target node ID', true);
      return;
    }
    
    const apiKey = this.apiKeyInput.value.trim();
    const targetNodeId = nodeIdValidation.nodeId!; // We know it's valid from the check above
    
    // Validate required fields
    if (!apiKey) {
      this.showToast('API Token is required', true);
      return;
    }
    
    if (!supertagId) {
      this.showToast('Save to Tana Supertag ID is required. Please extract schema.', true);
      return;
    }
    
    if (!tanaFieldIds.URL || !tanaFieldIds.Author || !tanaFieldIds.Description) {
      this.showToast('URL, Author, and Description field IDs are required.', true);
      return;
    }
    
    // Save configuration to storage
    chrome.storage.sync.set({
      apiKey,
      targetNodeId,
      supertagId,
      tanaFieldIds
    }, () => {
      this.showToast('Configuration saved successfully!');
    });
  }

  /**
   * Validate the form and update UI
   */
  private validateForm(): void {
    const apiKey = this.apiKeyInput.value.trim();
    const targetNodeId = this.targetNodeIdInput.value.trim();
    const supertagId = this.supertagIdInput.value.trim();
    
    // Enable save button if we have all required fields
    this.saveButton.disabled = !apiKey || !targetNodeId || !supertagId;
  }

  /**
   * Show a toast message
   * @param message - Message to display
   * @param isError - Whether this is an error message
   */
  private showToast(message: string, isError = false): void {
    if (!this.toast) return;
    
    this.toast.textContent = message;
    this.toast.className = 'toast' + (isError ? ' error' : ' success') + ' show';
    
    setTimeout(() => {
      if (this.toast) {
        this.toast.textContent = '';
        this.toast.className = 'toast';
      }
    }, 3000);
  }

  /**
   * Extract schema from textarea
   */
  private extractSchemaFromTextarea(): void {
    console.log('extractSchemaFromTextarea called');
    
    this.schemaErrorDiv.style.display = 'none';
    this.schemaErrorDiv.textContent = '';
    
    const raw = this.tanaSchemaInput.value;
    console.log('Raw textarea value:', raw ? `${raw.length} characters` : 'empty');
    
    let schema;
    
    try {
      schema = JSON.parse(raw);
      console.log('JSON parsed successfully:', schema);
    } catch (e) {
      const error = e as Error;
      console.error('JSON parsing failed:', error);
      this.schemaErrorDiv.textContent = 'Could not parse JSON. Please paste the API payload as copied from Tana. Error: ' + error.message;
      this.schemaErrorDiv.style.display = 'block';
      this.extractedFieldsDiv.style.display = 'none';
      return;
    }
    
    try {
      const result = this.extractSchemaInfo(schema);
      
      // Fill the inputs
      this.supertagIdInput.value = result.supertagId;
      this.fieldIdUrlInput.value = result.fieldIds.URL || '';
      this.fieldIdAuthorInput.value = result.fieldIds.Author || '';
      this.fieldIdDescriptionInput.value = result.fieldIds.Description || '';
      // Content field is commented out - using hierarchical content instead
      
      // Show extracted info as a labeled list
      this.extractedFieldsDiv.style.display = 'block';
      this.extractedFieldIdsPre.innerHTML =
        'Supertag ID: ' + result.supertagId + '\n' +
        Object.entries(result.fieldIds).map(([k, v]) => `${k} ID: ${v}`).join('\n');
      
      // Store in chrome.storage, preserving current form values for apiKey and targetNodeId
      const currentApiKey = this.apiKeyInput.value.trim();
      const currentTargetNodeId = this.targetNodeIdInput.value.trim();
      
      // Validate current target node ID if provided
      let validatedTargetNodeId = '';
      if (currentTargetNodeId) {
        const nodeIdValidation = validateTargetNodeId(currentTargetNodeId);
        if (nodeIdValidation.success) {
          validatedTargetNodeId = nodeIdValidation.nodeId!;
        } else {
          this.showToast(`Invalid target node ID: ${nodeIdValidation.error}`, true);
          return;
        }
      }
      
      chrome.storage.sync.get(['apiKey', 'targetNodeId'], (existing) => {
        chrome.storage.sync.set({
          apiKey: currentApiKey || existing.apiKey || '',
          targetNodeId: validatedTargetNodeId || existing.targetNodeId || '',
          supertagId: result.supertagId,
          tanaFieldIds: result.fieldIds
        }, () => {
          this.showToast('Schema extracted and saved!');
        });
      });
    } catch (e) {
      const error = e as Error;
      this.schemaErrorDiv.textContent = 'Failed to extract schema info: ' + error.message;
      this.schemaErrorDiv.style.display = 'block';
      this.extractedFieldsDiv.style.display = 'none';
    }
  }

  /**
   * Extract schema information from parsed JSON
   * @param schema - Parsed schema JSON
   * @returns Extracted schema information
   */
  private extractSchemaInfo(schema: any): SchemaParseResult {
    // Assume first node in nodes array
    const node = Array.isArray(schema.nodes) ? schema.nodes[0] : null;
    if (!node) throw new Error('No nodes found in schema payload.');
    
    // Extract supertagId
    const supertagId = node.supertags?.[0]?.id || '';
    if (!supertagId) throw new Error('No supertag ID found in schema.');
    
    // Extract field IDs by name from children
    const fieldIds: Partial<TanaFieldIds> = {};
    
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child.type === 'field' && child.attributeId) {
          if (child.children?.[0]?.dataType === 'url') {
            fieldIds.URL = child.attributeId;
          } else if (fieldIds.Author === undefined) {
            fieldIds.Author = child.attributeId;
          } else if (fieldIds.Description === undefined) {
            fieldIds.Description = child.attributeId;
          } else {
            // Content field is commented out - using hierarchical content instead
          }
        }
      }
    }
    
    return {
      supertagId,
      fieldIds: fieldIds as TanaFieldIds
    };
  }

  /**
   * Clean and parse Tana schema from TypeScript-like format
   * This is a utility function for testing and development
   * @param sample - TypeScript-like schema definition
   * @returns Cleaned JSON string
   */
  static cleanSchemaString(sample: string): string {
    const lines = sample.split('\n');
    
    // Remove type definition line and closing line
    if (lines[0].trim().startsWith('type')) lines.shift();
    if (lines[lines.length - 1].trim().replace(/[;\s]/g, '') === '}') lines.pop();
    
    // Clean each line
    let cleaned = lines
      .map(line => line
        .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove block comments
        .replace(/\/\/.*$/g, '')           // Remove line comments
        .replace(/^\s*\w+\??:.*;\s*$/g, '') // Remove type definitions
        .replace(/;/g, '')                 // Remove semicolons
        .replace(/\?/g, '')                // Remove optional markers
        .replace(/'/g, '"')                // Replace single quotes with double quotes
        .trim()
      )
      .filter(line => line.length > 0)
      .join('\n');
    
    // Fix trailing commas and property names
    cleaned = cleaned.replace(/,\s*([\]\}])/g, '$1');
    cleaned = cleaned.replace(/(^|[,{\s])(\w+):/g, '$1"$2":');
    
    // Ensure it's a valid JSON object
    if (!cleaned.trim().startsWith('{')) cleaned = '{' + cleaned + '}';
    
    return cleaned;
  }
}

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});
