/**
 * Test setup file - runs before all tests
 */
import 'dotenv/config';

// Mock Chrome APIs for testing
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
    sendMessage: () => {},
    lastError: null,
  },
  storage: {
    sync: {
      get: () => {},
      set: () => {},
    },
  },
  tabs: {
    query: () => {},
    sendMessage: () => {},
  },
};

// Make Chrome APIs available globally in tests
(global as any).chrome = mockChrome; 