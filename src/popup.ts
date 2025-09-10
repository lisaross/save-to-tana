import type { SaveToTanaRequest } from './types';

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
    chrome.storage.sync.get(['apiKey', 'supertagId', 'targetNodeId'], (result) => {
      if (!result.apiKey || !result.supertagId || !result.targetNodeId) {
        this.saveButton.disabled = true;
        this.notConfiguredDiv.style.display = 'block';
      }
    });
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

    const options: ExtractOptions = {
      includeContent: this.includeContentCheckbox.checked,
      includeTitle: this.includeTitleCheckbox.checked,
    };

    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab || typeof currentTab.id !== 'number') {
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
        options: options,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          this.handleError(
            `Error communicating with the page: ${chrome.runtime.lastError.message}`,
          );
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

        // Send data to background script
        this.sendToBackground(response);
      },
    );
  }

  /**
   * Send extracted data to the background script
   * @param data - Extracted data to send
   */
  private sendToBackground(data: any): void {
    const request: SaveToTanaRequest = {
      action: 'saveToTana',
      data: data,
    };

    chrome.runtime.sendMessage(request, (result) => {
      if (chrome.runtime.lastError) {
        this.handleError(`Error sending request: ${chrome.runtime.lastError.message}`);
        return;
      }
      
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

      this.showSuccess('Saved to Tana successfully!');
    });
  }

  /**
   * Handle an error
   * @param message - Error message
   */
  private handleError(message: string): void {
    this.saveButton.disabled = false;
    this.saveButton.textContent = 'Save to Tana';
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
    this.statusDiv.className = `status${status.isError ? ' error' : status.message ? ' success' : ''}`;
  }
}

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
