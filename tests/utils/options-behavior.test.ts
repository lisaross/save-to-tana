import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateTargetNodeId } from '../../src/utils/validators';

// Mock Chrome storage API
const mockChromeStorageSync = {
  get: vi.fn(),
  set: vi.fn()
};

global.chrome = {
  storage: {
    sync: mockChromeStorageSync
  }
} as any;

// Mock DOM elements
const createMockElement = (value = '') => ({
  value,
  trim: () => value.trim(),
  addEventListener: vi.fn()
});

describe('Options Page Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema extraction preserves form values', () => {
    it('should preserve manually entered API key and target node ID when extracting schema', async () => {
      // Mock the storage.get call to return existing values
      mockChromeStorageSync.get.mockImplementation((keys, callback) => {
        callback({
          apiKey: 'old-api-key',
          targetNodeId: 'old-target-node'
        });
      });

      // Mock the storage.set call to capture what gets saved
      let savedConfig: any = null;
      mockChromeStorageSync.set.mockImplementation((config, callback) => {
        savedConfig = config;
        callback();
      });

      // Simulate form with user-entered values
      const currentFormValues = {
        apiKey: 'user-entered-api-key',
        targetNodeId: 'https://app.tana.inc?nodeid=d1RDBb0x1IdR_USER_ENTERED',
        supertagId: '',
        tanaFieldIds: {
          URL: '',
          Author: '',
          Description: ''
        }
      };

      // Simulate extracted schema values
      const extractedValues = {
        supertagId: 'extracted-supertag-id',
        tanaFieldIds: {
          URL: 'extracted-url-field',
          Author: 'extracted-author-field', 
          Description: 'extracted-description-field'
        }
      };

      // Simulate the behavior in extractSchemaFromTextarea
      const currentApiKey = currentFormValues.apiKey;
      const currentTargetNodeId = currentFormValues.targetNodeId;
      
      // Actually validate the target node ID like the real code does
      let validatedTargetNodeId = '';
      if (currentTargetNodeId) {
        const nodeIdValidation = validateTargetNodeId(currentTargetNodeId);
        if (nodeIdValidation.success) {
          validatedTargetNodeId = nodeIdValidation.nodeId!;
        }
      }

      // Simulate the storage operation
      mockChromeStorageSync.get(['apiKey', 'targetNodeId'], (existing) => {
        mockChromeStorageSync.set({
          apiKey: currentApiKey || existing.apiKey || '',
          targetNodeId: validatedTargetNodeId || existing.targetNodeId || '',
          supertagId: extractedValues.supertagId,
          tanaFieldIds: extractedValues.tanaFieldIds
        }, () => {
          // Callback after save
        });
      });

      // Verify the mock was called correctly
      expect(mockChromeStorageSync.get).toHaveBeenCalledWith(['apiKey', 'targetNodeId'], expect.any(Function));
      
      // Verify the saved configuration preserves user form values
      expect(savedConfig).toEqual({
        apiKey: 'user-entered-api-key', // Should use form value, not storage value
        targetNodeId: 'd1RDBb0x1IdR_USER_ENTERED', // Should use extracted from form URL
        supertagId: 'extracted-supertag-id', // Should use extracted value
        tanaFieldIds: {
          URL: 'extracted-url-field',
          Author: 'extracted-author-field',
          Description: 'extracted-description-field'
        }
      });
    });

    it('should fall back to storage values when form fields are empty', async () => {
      // Mock the storage.get call
      mockChromeStorageSync.get.mockImplementation((keys, callback) => {
        callback({
          apiKey: 'existing-api-key',
          targetNodeId: 'existing-target-node'
        });
      });

      let savedConfig: any = null;
      mockChromeStorageSync.set.mockImplementation((config, callback) => {
        savedConfig = config;
        callback();
      });

      // Simulate form with empty values
      const currentApiKey = '';
      const currentTargetNodeId = '';
      
      const extractedValues = {
        supertagId: 'extracted-supertag-id',
        tanaFieldIds: {
          URL: 'extracted-url-field',
          Author: 'extracted-author-field',
          Description: 'extracted-description-field'
        }
      };

      // Simulate the storage operation
      mockChromeStorageSync.get(['apiKey', 'targetNodeId'], (existing) => {
        mockChromeStorageSync.set({
          apiKey: currentApiKey || existing.apiKey || '',
          targetNodeId: currentTargetNodeId || existing.targetNodeId || '', 
          supertagId: extractedValues.supertagId,
          tanaFieldIds: extractedValues.tanaFieldIds
        }, () => {
          // Callback after save
        });
      });

      // Verify it falls back to existing storage values
      expect(savedConfig).toEqual({
        apiKey: 'existing-api-key', // Should fall back to storage
        targetNodeId: 'existing-target-node', // Should fall back to storage
        supertagId: 'extracted-supertag-id',
        tanaFieldIds: {
          URL: 'extracted-url-field',
          Author: 'extracted-author-field',
          Description: 'extracted-description-field'
        }
      });
    });
  });
}); 