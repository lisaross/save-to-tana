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
  
  // State
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
    // First, try to inject the content script to ensure it's loaded
    this.ensureContentScriptLoaded(tabId)
      .then(() => {
        // Now try to communicate with the content script
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
      })
      .catch((error) => {
        console.log('Content script injection failed, trying fallback method:', error.message);
        this.updateProgress(15, 'Trying alternative extraction method...');
        
        // Try fallback extraction method
        this.extractContentWithFallback(tabId, options)
          .then((data) => {
            this.updateProgress(25, 'Content extracted, sending to Tana...');
            this.sendToBackground(data);
          })
          .catch((fallbackError) => {
            this.handleError('Failed to extract content: ' + error.message + '. Please refresh the page and try again.');
          });
      });
  }

  /**
   * Ensure content script is loaded in the tab
   * @param tabId - ID of the tab
   * @returns Promise that resolves when content script is ready
   */
  private async ensureContentScriptLoaded(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // First, try to ping the existing content script
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded, try to inject it
          console.log('Content script not found, attempting injection...');
          
          // Get tab info to check if injection is possible
          chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError) {
              reject(new Error('Cannot access tab information'));
              return;
            }
            
            // Check if this is a restricted page
            if (tab.url?.startsWith('chrome://') || 
                tab.url?.startsWith('chrome-extension://') || 
                tab.url?.startsWith('edge://') || 
                tab.url?.startsWith('moz-extension://') ||
                tab.url?.startsWith('about:')) {
              reject(new Error('Cannot inject content script on this type of page. Please try on a regular webpage.'));
              return;
            }
            
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['content.js']
            }, (results) => {
              if (chrome.runtime.lastError) {
                reject(new Error('Failed to inject content script: ' + chrome.runtime.lastError.message));
                return;
              }
              
              // Try multiple times with increasing delays to ensure script loads
              let attempts = 0;
              const maxAttempts = 5;
              const testContentScript = () => {
                attempts++;
                const delay = attempts * 200; // 200ms, 400ms, 600ms, 800ms, 1000ms
                
                setTimeout(() => {
                  chrome.tabs.sendMessage(tabId, { action: 'ping' }, (pingResponse) => {
                    if (chrome.runtime.lastError) {
                      if (attempts < maxAttempts) {
                        console.log(`Content script ping attempt ${attempts} failed, retrying...`);
                        testContentScript();
                      } else {
                        // Check if it's a page that might block content scripts
                        chrome.tabs.get(tabId, (tabInfo) => {
                          const url = tabInfo.url || '';
                          if (url.includes('accounts.google.com') || 
                              url.includes('login.') || 
                              url.includes('auth.') ||
                              url.includes('secure.')) {
                            reject(new Error('This page blocks content scripts for security. Please try on a different page.'));
                          } else {
                            reject(new Error('Content script injection failed. Please refresh the page and try again.'));
                          }
                        });
                      }
                    } else {
                      console.log(`Content script responding after ${attempts} attempts`);
                      resolve();
                    }
                  });
                }, delay);
              };
              
              // Start testing
              testContentScript();
            });
          });
        } else {
          // Content script is already loaded and responding
          console.log('Content script already loaded and responding');
          resolve();
        }
      });
    });
  }

  /**
   * Fallback content extraction method using chrome.scripting
   * @param tabId - ID of the tab
   * @param options - Extraction options
   * @returns Promise with extracted data
   */
  private async extractContentWithFallback(tabId: number, options: ExtractOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      // Execute extraction code directly in the page
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (extractOptions: any) => {
          // Basic extraction function that runs directly in the page
          try {
            const pageData: any = {
              url: window.location.href,
              title: document.title,
              author: '',
              description: '',
              content: '',
              hierarchicalNodes: []
            };
            
            // Extract author from meta tags
            const authorMeta = document.querySelector('meta[name="author"]') || 
                              document.querySelector('meta[property="article:author"]');
            if (authorMeta) {
              pageData.author = authorMeta.getAttribute('content') || '';
            }
            
            // Extract description from meta tags
            const descMeta = document.querySelector('meta[name="description"]') || 
                            document.querySelector('meta[property="og:description"]');
            if (descMeta) {
              pageData.description = descMeta.getAttribute('content') || '';
            }
            
            // Basic content extraction if requested
            if (extractOptions.includeContent) {
              // Try to find main content area
              const main = document.querySelector('main') || 
                          document.querySelector('[role="main"]') || 
                          document.querySelector('.main-content') ||
                          document.querySelector('#main-content') ||
                          document.querySelector('.content') ||
                          document.body;
              
              if (main) {
                // Extract text content from paragraphs and headings
                const contentElements = main.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li');
                const contentNodes: any[] = [];
                
                for (const element of contentElements) {
                  const text = element.textContent?.trim();
                  if (text && text.length > 10) {
                    contentNodes.push({ name: text });
                  }
                }
                
                if (contentNodes.length > 0) {
                  pageData.hierarchicalNodes = [{
                    name: pageData.title || 'Page Content',
                    supertags: [],
                    children: contentNodes
                  }];
                }
              }
            }
            
            // Handle title option
            if (!extractOptions.includeTitle || !pageData.title) {
              pageData.title = pageData.url;
            }
            
            // Sanitize title
            if (pageData.title) {
              pageData.title = pageData.title.replace(/\r?\n|\r/g, ' ').trim();
            }
            
            return pageData;
          } catch (error) {
            return {
              url: window.location.href,
              title: document.title,
              author: '',
              description: '',
              content: '',
              error: true,
              message: 'Fallback extraction failed: ' + (error instanceof Error ? error.message : 'Unknown error')
            };
          }
        },
        args: [options]
      }, (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error('Fallback extraction failed: ' + chrome.runtime.lastError.message));
          return;
        }
        
        if (!results || !results[0] || !results[0].result) {
          reject(new Error('No data extracted from fallback method'));
          return;
        }
        
        const data = results[0].result as any;
        if (data.error) {
          reject(new Error(data.message || 'Fallback extraction error'));
          return;
        }
        
        resolve(data);
      });
    });
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
    // Reset button
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
    // Reset button
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
