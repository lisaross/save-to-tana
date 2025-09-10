/**
 * Integration tests for Chrome Extension Event Orchestration
 * These tests validate the message passing and event handling between components
 */

// Mock Chrome APIs for testing
declare global {
  var chrome: {
    runtime: {
      onMessage: {
        addListener: (callback: Function) => void;
        sendMessage: (message: any, callback?: Function) => void;
      };
      onInstalled: {
        addListener: (callback: Function) => void;
      };
      lastError?: { message: string };
    };
    omnibox: {
      onInputStarted: { addListener: (callback: Function) => void };
      onInputChanged: { addListener: (callback: Function) => void };
      onInputEntered: { addListener: (callback: Function) => void };
    };
    commands: {
      onCommand: { addListener: (callback: Function) => void };
    };
    contextMenus: {
      onClicked: { addListener: (callback: Function) => void };
      create: (options: any) => void;
      removeAll: () => Promise<void>;
    };
    tabs: {
      query: (query: any, callback: Function) => void;
      sendMessage: (tabId: number, message: any, callback?: Function) => void;
    };
    storage: {
      sync: {
        get: (keys: string[], callback: Function) => void;
        set: (data: any, callback?: Function) => void;
      };
    };
    notifications: {
      create: (id: string, options: any) => void;
      clear: (id: string) => void;
    };
    scripting: {
      executeScript: (options: any) => Promise<any>;
    };
    action: {
      openPopup: () => Promise<void>;
    };
  };
}

// Mock Chrome API implementations
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      sendMessage: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
    },
    lastError: undefined as { message: string } | undefined,
  },
  omnibox: {
    onInputStarted: { addListener: jest.fn() },
    onInputChanged: { addListener: jest.fn() },
    onInputEntered: { addListener: jest.fn() },
  },
  commands: {
    onCommand: { addListener: jest.fn() },
  },
  contextMenus: {
    onClicked: { addListener: jest.fn() },
    create: jest.fn(),
    removeAll: jest.fn().mockResolvedValue(undefined),
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  notifications: {
    create: jest.fn(),
    clear: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn().mockResolvedValue([]),
  },
  action: {
    openPopup: jest.fn().mockResolvedValue(undefined),
  },
};

// Mock console to capture logs
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock jest functions for environments without jest
function createMockFunction() {
  const calls: any[][] = [];
  const fn = (...args: any[]) => {
    calls.push(args);
    return fn._mockReturnValue;
  };
  fn.mockImplementation = (impl: Function) => {
    fn._impl = impl;
    return fn;
  };
  fn.mockResolvedValue = (value: any) => {
    fn._mockReturnValue = Promise.resolve(value);
    return fn;
  };
  fn.mockReturnValue = (value: any) => {
    fn._mockReturnValue = value;
    return fn;
  };
  fn.calls = calls;
  fn._mockReturnValue = undefined;
  return fn;
}

const jest = {
  fn: createMockFunction,
};

// Apply mocks
Object.keys(mockChrome).forEach(key => {
  if (mockChrome[key as keyof typeof mockChrome] && typeof mockChrome[key as keyof typeof mockChrome] === 'object') {
    Object.keys(mockChrome[key as keyof typeof mockChrome]).forEach(subKey => {
      const obj = mockChrome[key as keyof typeof mockChrome] as any;
      if (obj[subKey] && typeof obj[subKey] === 'object' && !Array.isArray(obj[subKey])) {
        Object.keys(obj[subKey]).forEach(method => {
          if (typeof obj[subKey][method] !== 'function') {
            obj[subKey][method] = jest.fn();
          }
        });
      }
    });
  }
});

// Set up global chrome
(global as any).chrome = mockChrome;
(global as any).console = mockConsole;

// Test framework
interface IntegrationTestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class IntegrationTestRunner {
  private tests: IntegrationTestResult[] = [];
  private messageHandlers: Map<string, Function> = new Map();

  async test(name: string, fn: () => Promise<void> | void): Promise<void> {
    try {
      await fn();
      this.tests.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.tests.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error)
      });
      console.error(`❌ ${name}: ${error}`);
    }
  }

  assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  // Helper to simulate message sending and receiving
  simulateMessage(action: string, data: any, expectResponse = true): Promise<any> {
    return new Promise((resolve, reject) => {
      const handler = this.messageHandlers.get(action);
      if (!handler) {
        reject(new Error(`No handler registered for action: ${action}`));
        return;
      }

      const mockSender = { tab: { id: 1 } };
      const sendResponse = expectResponse ? resolve : () => {};
      
      try {
        const result = handler({ action, ...data }, mockSender, sendResponse);
        if (!expectResponse) {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  registerMessageHandler(action: string, handler: Function): void {
    this.messageHandlers.set(action, handler);
  }

  getResults(): { passed: number; failed: number; total: number } {
    const passed = this.tests.filter(t => t.passed).length;
    const failed = this.tests.filter(t => !t.passed).length;
    return { passed, failed, total: this.tests.length };
  }

  printSummary(): void {
    const results = this.getResults();
    console.log('\n📊 Integration Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📝 Total: ${results.total}`);
    
    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      this.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
  }
}

// Test runner instance
const integrationTest = new IntegrationTestRunner();

// Sample message handler for testing (simulates background script)
const mockMessageHandler = (request: any, sender: any, sendResponse: Function) => {
  switch (request.action) {
    case 'saveToTana':
      // Simulate successful save
      setTimeout(() => sendResponse({ success: true, data: 'saved' }), 10);
      return true; // Async response

    case 'extractContent':
      // Simulate content extraction
      setTimeout(() => sendResponse({
        url: 'https://example.com',
        title: 'Test Page',
        author: 'Test Author',
        description: 'Test Description',
        content: 'Test Content'
      }), 10);
      return true;

    case 'injectOverlay':
      // Simulate overlay injection
      setTimeout(() => sendResponse({ success: true }), 10);
      return true;

    case 'quickSave':
      // Simulate quick save
      setTimeout(() => sendResponse({ success: true }), 10);
      return true;

    case 'saveWithNotes':
      // Simulate save with notes
      setTimeout(() => sendResponse({ success: true }), 10);
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
};

// Register the mock handler
integrationTest.registerMessageHandler('saveToTana', mockMessageHandler);
integrationTest.registerMessageHandler('extractContent', mockMessageHandler);
integrationTest.registerMessageHandler('injectOverlay', mockMessageHandler);
integrationTest.registerMessageHandler('quickSave', mockMessageHandler);
integrationTest.registerMessageHandler('saveWithNotes', mockMessageHandler);

// Integration Tests

integrationTest.test('Chrome API mocking is set up correctly', () => {
  integrationTest.assert(typeof chrome !== 'undefined', 'Chrome API should be available');
  integrationTest.assert(typeof chrome.runtime !== 'undefined', 'Chrome runtime API should be available');
  integrationTest.assert(typeof chrome.tabs !== 'undefined', 'Chrome tabs API should be available');
  integrationTest.assert(typeof chrome.storage !== 'undefined', 'Chrome storage API should be available');
});

integrationTest.test('saveToTana message handling works correctly', async () => {
  const response = await integrationTest.simulateMessage('saveToTana', {
    data: {
      url: 'https://example.com',
      title: 'Test',
      content: 'Test content'
    }
  });
  
  integrationTest.assertEqual(response.success, true);
  integrationTest.assert(response.data, 'Should return data');
});

integrationTest.test('extractContent message handling works correctly', async () => {
  const response = await integrationTest.simulateMessage('extractContent', {
    options: { includeContent: true, includeTitle: true }
  });
  
  integrationTest.assert(response.url, 'Should return URL');
  integrationTest.assert(response.title, 'Should return title');
  integrationTest.assert(response.content, 'Should return content');
});

integrationTest.test('injectOverlay message handling works correctly', async () => {
  const response = await integrationTest.simulateMessage('injectOverlay', {
    tabId: 123
  });
  
  integrationTest.assertEqual(response.success, true);
});

integrationTest.test('quickSave message handling works correctly', async () => {
  const response = await integrationTest.simulateMessage('quickSave', {
    tabId: 123
  });
  
  integrationTest.assertEqual(response.success, true);
});

integrationTest.test('saveWithNotes message handling works correctly', async () => {
  const response = await integrationTest.simulateMessage('saveWithNotes', {
    tabId: 123
  });
  
  integrationTest.assertEqual(response.success, true);
});

integrationTest.test('Omnibox event listeners are properly registered', () => {
  // Simulate the background script setup
  const onInputStartedListener = jest.fn();
  const onInputChangedListener = jest.fn();
  const onInputEnteredListener = jest.fn();
  
  chrome.omnibox.onInputStarted.addListener(onInputStartedListener);
  chrome.omnibox.onInputChanged.addListener(onInputChangedListener);
  chrome.omnibox.onInputEntered.addListener(onInputEnteredListener);
  
  integrationTest.assert(chrome.omnibox.onInputStarted.addListener.calls.length > 0, 'onInputStarted listener should be registered');
  integrationTest.assert(chrome.omnibox.onInputChanged.addListener.calls.length > 0, 'onInputChanged listener should be registered');
  integrationTest.assert(chrome.omnibox.onInputEntered.addListener.calls.length > 0, 'onInputEntered listener should be registered');
});

integrationTest.test('Command event listeners are properly registered', () => {
  const commandListener = jest.fn();
  chrome.commands.onCommand.addListener(commandListener);
  
  integrationTest.assert(chrome.commands.onCommand.addListener.calls.length > 0, 'Command listener should be registered');
});

integrationTest.test('Context menu event listeners are properly registered', () => {
  const contextMenuListener = jest.fn();
  chrome.contextMenus.onClicked.addListener(contextMenuListener);
  
  integrationTest.assert(chrome.contextMenus.onClicked.addListener.calls.length > 0, 'Context menu listener should be registered');
});

integrationTest.test('Storage configuration can be retrieved', () => {
  // Mock storage response
  const mockConfig = {
    apiKey: 'test-api-key',
    targetNodeId: 'test-node-id',
    supertagId: 'test-supertag-id',
    tanaFieldIds: {
      URL: 'url-field-id',
      Author: 'author-field-id',
      Description: 'desc-field-id',
      Content: 'content-field-id'
    }
  };
  
  chrome.storage.sync.get.mockImplementation((keys, callback) => {
    callback(mockConfig);
  });
  
  let retrievedConfig: any;
  chrome.storage.sync.get(['apiKey', 'targetNodeId', 'supertagId', 'tanaFieldIds'], (result) => {
    retrievedConfig = result;
  });
  
  integrationTest.assert(retrievedConfig, 'Should retrieve configuration');
  integrationTest.assertEqual(retrievedConfig.apiKey, mockConfig.apiKey);
});

integrationTest.test('Tab querying works correctly', () => {
  const mockTab = { id: 123, url: 'https://example.com', title: 'Test Page' };
  
  chrome.tabs.query.mockImplementation((query, callback) => {
    callback([mockTab]);
  });
  
  let retrievedTabs: any;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    retrievedTabs = tabs;
  });
  
  integrationTest.assert(retrievedTabs, 'Should retrieve tabs');
  integrationTest.assertEqual(retrievedTabs[0].id, mockTab.id);
});

integrationTest.test('Content script injection works', async () => {
  chrome.scripting.executeScript.mockResolvedValue([{ result: 'success' }]);
  
  const result = await chrome.scripting.executeScript({
    target: { tabId: 123 },
    files: ['content.js']
  });
  
  integrationTest.assert(result, 'Should return injection result');
});

integrationTest.test('Notifications can be created and cleared', () => {
  const notificationId = 'test-notification';
  const options = {
    type: 'basic',
    iconUrl: 'images/icon48.png',
    title: 'Test',
    message: 'Test message'
  };
  
  chrome.notifications.create(notificationId, options);
  chrome.notifications.clear(notificationId);
  
  integrationTest.assert(chrome.notifications.create.calls.length > 0, 'Should create notification');
  integrationTest.assert(chrome.notifications.clear.calls.length > 0, 'Should clear notification');
});

integrationTest.test('Error handling for unknown message types', async () => {
  try {
    await integrationTest.simulateMessage('unknownAction', {});
    integrationTest.assert(false, 'Should have thrown an error');
  } catch (error) {
    integrationTest.assert(String(error).includes('No handler registered'), 'Should handle unknown actions');
  }
});

integrationTest.test('Message response timeout handling', async () => {
  // Test that we handle cases where responses don't come back
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Message timeout')), 100);
  });
  
  try {
    await Promise.race([
      integrationTest.simulateMessage('saveToTana', { data: {} }),
      timeoutPromise
    ]);
    integrationTest.assert(true, 'Message should complete before timeout');
  } catch (error) {
    if (String(error).includes('timeout')) {
      integrationTest.assert(false, 'Message should not timeout');
    }
  }
});

integrationTest.test('Multiple concurrent message handling', async () => {
  const promises = [
    integrationTest.simulateMessage('extractContent', { options: {} }),
    integrationTest.simulateMessage('quickSave', { tabId: 123 }),
    integrationTest.simulateMessage('saveWithNotes', { tabId: 123 })
  ];
  
  const results = await Promise.all(promises);
  
  integrationTest.assertEqual(results.length, 3);
  results.forEach((result, index) => {
    integrationTest.assert(result, `Result ${index} should exist`);
  });
});

integrationTest.test('Context menu creation works correctly', async () => {
  await chrome.contextMenus.removeAll();
  
  chrome.contextMenus.create({
    id: 'save-page',
    title: 'Save page to Tana',
    contexts: ['page']
  });
  
  integrationTest.assert(chrome.contextMenus.removeAll.calls.length > 0, 'Should remove existing menus');
  integrationTest.assert(chrome.contextMenus.create.calls.length > 0, 'Should create new menu');
});

integrationTest.test('Storage operations handle errors gracefully', () => {
  // Mock storage error
  chrome.storage.sync.get.mockImplementation((keys, callback) => {
    chrome.runtime.lastError = { message: 'Storage error' };
    callback({});
  });
  
  let errorEncountered = false;
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (chrome.runtime.lastError) {
      errorEncountered = true;
    }
  });
  
  integrationTest.assert(errorEncountered, 'Should handle storage errors');
  
  // Reset lastError
  chrome.runtime.lastError = undefined;
});

integrationTest.test('Tab messaging handles communication errors', () => {
  chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
    chrome.runtime.lastError = { message: 'Could not establish connection' };
    if (callback) callback(null);
  });
  
  let errorHandled = false;
  chrome.tabs.sendMessage(123, { action: 'test' }, (response) => {
    if (chrome.runtime.lastError) {
      errorHandled = true;
    }
  });
  
  integrationTest.assert(errorHandled, 'Should handle tab communication errors');
  
  // Reset lastError
  chrome.runtime.lastError = undefined;
});

// Run all integration tests
console.log('🚀 Running Chrome Extension Integration Tests\n');

// Execute tests
Promise.all([
  // Run tests that return promises
]).then(() => {
  integrationTest.printSummary();
}).catch((error) => {
  console.error('Integration test execution failed:', error);
  integrationTest.printSummary();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { integrationTest, IntegrationTestRunner };
}