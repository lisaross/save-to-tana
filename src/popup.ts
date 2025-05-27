import { SaveToTanaRequest } from 'types';

/**
 * Popup controller interfaces
 */
interface ExtractOptions {
  includeContent: boolean;
  includeTitle: boolean;
}

interface StatusMessage {
  message: string;
  isError: boolean;
}

/**
 * Popup controller for the Save to Tana extension
 */
export class PopupController {
  // UI elements
  private saveButton: HTMLButtonElement;
  private statusDiv: HTMLDivElement;
  private openOptionsLink: HTMLAnchorElement;
  private includeContentCheckbox: HTMLInputElement;
  private includeTitleCheckbox: HTMLInputElement;
  private notConfiguredDiv: HTMLDivElement;
  private progressContainer: HTMLDivElement;
  private progressFill: HTMLDivElement;
  private progressText: HTMLDivElement;
  
  // Progress tracking
  private progressInterval: number | null = null;

  /**
   * Initialize the popup controller
   */
  constructor() {
    // Get UI elements
    this.saveButton = document.getElementById('save-button') as HTMLButtonElement;
    this.statusDiv = document.getElementById('status') as HTMLDivElement;
    this.openOptionsLink = document.getElementById('open-options') as HTMLAnchorElement;
    this.includeContentCheckbox = document.getElementById('include-content') as HTMLInputElement;
    this.includeTitleCheckbox = document.getElementById('include-title') as HTMLInputElement;
    this.notConfiguredDiv = document.getElementById('not-configured') as HTMLDivElement;
    this.progressContainer = document.getElementById('progress-container') as HTMLDivElement;
    this.progressFill = document.getElementById('progress-fill') as HTMLDivElement;
    this.progressText = document.getElementById('progress-text') as HTMLDivElement;
    
    // Initialize the popup
    this.initializePopup();
  }

  /**
   * Initialize the popup
   */
  private initializePopup(): void {
    // Check if extension is configured
    this.checkConfiguration();
    
    // Set up event listeners
    this.openOptionsLink.addEventListener('click', this.openOptions.bind(this));
    this.saveButton.addEventListener('click', this.saveToTana.bind(this));
  }

  /**
   * Check if the extension is configured
   */
  private checkConfiguration(): void {
    chrome.storage.sync.get(
      ['apiKey', 'supertagId', 'targetNodeId'], 
      (result) => {
        if (!result.apiKey || !result.supertagId || !result.targetNodeId) {
          this.saveButton.disabled = true;
          this.notConfiguredDiv.style.display = 'block';
        }
      }
    );
  }

  /**
   * Open the options page
   */
  private openOptions(): void {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Save the current page to Tana
   */
  private saveToTana(): void {
    this.saveButton.disabled = true;
    this.saveButton.textContent = 'Saving...';
    this.updateStatus({ message: '', isError: false });
    this.showProgress('Extracting content...');
    
    const options: ExtractOptions = {
      includeContent: this.includeContentCheckbox.checked,
      includeTitle: this.includeTitleCheckbox.checked
    };
    
    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab.id) {
        this.handleError('Cannot access the current tab.');
        return;
      }
      
      // Extract content from the page
      this.extractContentFromPage(currentTab.id, options);
    });
  }

  /**
   * Extract content from the page
   * @param tabId - ID of the tab to extract content from
   * @param options - Extraction options
   */
  private extractContentFromPage(tabId: number, options: ExtractOptions): void {
    chrome.tabs.sendMessage(
      tabId, 
      {
        action: 'extractContent',
        options: options
      }, 
      (response) => {
        if (chrome.runtime.lastError) {
          this.handleError('Error communicating with the page: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (!response) {
          this.handleError('No response from the page. Please refresh and try again.');
          return;
        }
        
        if (response.error) {
          this.handleError(response.message || 'Error extracting content from the page');
          return;
        }
        
        // Update progress
        this.updateProgress(25, 'Content extracted, sending to Tana...');
        
        // Send data to background script
        this.sendToBackground(response);
      }
    );
  }

  /**
   * Send extracted data to the background script
   * @param data - Extracted data to send
   */
  private sendToBackground(data: any): void {
    const request: SaveToTanaRequest = {
      action: 'saveToTana',
      data: data
    };
    
    // Estimate if this will be chunked based on content size
    const estimatedSize = JSON.stringify(data).length;
    const willBeChunked = estimatedSize > 4500;
    
    if (willBeChunked) {
      // For chunked content, show more realistic progress updates
      this.updateProgress(30, 'Preparing large content for upload...');
      
      // Simulate progress updates for chunked content
      let progressPercent = 30;
      this.progressInterval = window.setInterval(() => {
        if (progressPercent < 85) {
          progressPercent += 5;
          this.updateProgress(progressPercent, 'Uploading content chunks...');
        }
      }, 800); // Update every 800ms
      
      chrome.runtime.sendMessage(request, (result) => {
        this.clearProgressInterval();
        this.handleBackgroundResponse(result, willBeChunked);
      });
    } else {
      // For simple content, quick progress
      this.updateProgress(50, 'Uploading to Tana...');
      
      chrome.runtime.sendMessage(request, (result) => {
        this.handleBackgroundResponse(result, willBeChunked);
      });
    }
  }

  /**
   * Handle response from background script
   * @param result - Response from background script
   * @param wasChunked - Whether content was chunked
   */
  private handleBackgroundResponse(result: any, wasChunked: boolean): void {
    this.saveButton.disabled = false;
    this.saveButton.textContent = 'Save to Tana';
    
    if (!result) {
      this.handleError('No response from the extension. Please try again.');
      return;
    }
    
    if (!result.success) {
      this.handleError(result.error || 'Unknown error occurred');
      return;
    }
    
    // Handle response with chunking information
    this.updateProgress(100, 'Complete!');
    
    let successMessage = 'Saved to Tana successfully!';
    if (result.data && result.data.contentChunks > 0) {
      successMessage = `Saved to Tana successfully! (Content split into ${result.data.contentChunks} parts due to size)`;
    }
    
    // Show success after a brief delay to let users see 100% completion
    setTimeout(() => {
      this.hideProgress();
      this.showSuccess(successMessage);
    }, 500);
  }

  /**
   * Handle an error
   * @param message - Error message
   */
  private handleError(message: string): void {
    this.saveButton.disabled = false;
    this.saveButton.textContent = 'Save to Tana';
    this.hideProgress();
    this.updateStatus({ message, isError: true });
  }

  /**
   * Show a success message
   * @param message - Success message
   */
  private showSuccess(message: string): void {
    this.updateStatus({ message, isError: false });
    
    // Clear status after 3 seconds
    setTimeout(() => {
      this.updateStatus({ message: '', isError: false });
    }, 3000);
  }

  /**
   * Update the status display
   * @param status - Status message and type
   */
  private updateStatus(status: StatusMessage): void {
    this.statusDiv.textContent = status.message;
    this.statusDiv.className = 'status' + (status.isError ? ' error' : status.message ? ' success' : '');
  }

  /**
   * Show progress bar
   * @param text - Progress text to display
   */
  private showProgress(text: string = 'Processing...'): void {
    this.progressContainer.style.display = 'block';
    this.progressText.textContent = text;
    this.progressFill.style.width = '0%';
    this.updateStatus({ message: '', isError: false });
  }

  /**
   * Update progress bar
   * @param progress - Progress percentage (0-100)
   * @param text - Progress text to display
   */
  private updateProgress(progress: number, text: string): void {
    this.progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    this.progressText.textContent = text;
  }

  /**
   * Hide progress bar
   */
  private hideProgress(): void {
    this.clearProgressInterval();
    this.progressContainer.style.display = 'none';
  }

  /**
   * Clear progress interval if running
   */
  private clearProgressInterval(): void {
    if (this.progressInterval !== null) {
      window.clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
