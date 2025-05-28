import { describe, it, expect } from 'vitest';
import { extractNodeId, isValidNodeId, validateTargetNodeId } from '../../src/utils/validators';

describe('Tana Node ID Validators', () => {
  describe('isValidNodeId', () => {
    it('should validate correct node ID formats', () => {
      expect(isValidNodeId('d1RDBb0x1IdR_CAPTURE_INBOX')).toBe(true);
      expect(isValidNodeId('z-p8LdQk6I76')).toBe(true);
      expect(isValidNodeId('MaaJRCypzJ')).toBe(true);
      expect(isValidNodeId('abc123_def456')).toBe(true);
    });

    it('should validate special node IDs', () => {
      expect(isValidNodeId('INBOX')).toBe(true);
      expect(isValidNodeId('SCHEMA')).toBe(true);
      expect(isValidNodeId('LIBRARY')).toBe(true);
    });

    it('should reject invalid node ID formats', () => {
      expect(isValidNodeId('')).toBe(false);
      expect(isValidNodeId('   ')).toBe(false);
      expect(isValidNodeId('ab')).toBe(false); // too short
      expect(isValidNodeId('a'.repeat(50))).toBe(false); // too long
      expect(isValidNodeId('-invalid-start')).toBe(false); // starts with dash
      expect(isValidNodeId('invalid-end-')).toBe(false); // ends with dash
      expect(isValidNodeId('invalid@symbol')).toBe(false); // invalid symbol
      expect(isValidNodeId('invalid space')).toBe(false); // contains space
    });

    it('should handle null/undefined inputs', () => {
      expect(isValidNodeId(null as any)).toBe(false);
      expect(isValidNodeId(undefined as any)).toBe(false);
      expect(isValidNodeId({} as any)).toBe(false);
    });
  });

  describe('extractNodeId', () => {
    it('should extract node ID from full Tana URLs', () => {
      expect(extractNodeId('https://app.tana.inc?nodeid=d1RDBb0x1IdR_CAPTURE_INBOX'))
        .toBe('d1RDBb0x1IdR_CAPTURE_INBOX');
      
      expect(extractNodeId('https://app.tana.inc?nodeid=z-p8LdQk6I76'))
        .toBe('z-p8LdQk6I76');
        
      expect(extractNodeId('https://app.tana.inc?nodeid=MaaJRCypzJ&other=param'))
        .toBe('MaaJRCypzJ');
    });

    it('should handle URLs with @ prefix (as user might copy)', () => {
      expect(extractNodeId('@https://app.tana.inc?nodeid=d1RDBb0x1IdR_CAPTURE_INBOX'))
        .toBe('d1RDBb0x1IdR_CAPTURE_INBOX');
    });

    it('should return node ID if input is already a valid node ID', () => {
      expect(extractNodeId('d1RDBb0x1IdR_CAPTURE_INBOX')).toBe('d1RDBb0x1IdR_CAPTURE_INBOX');
      expect(extractNodeId('z-p8LdQk6I76')).toBe('z-p8LdQk6I76');
      expect(extractNodeId('INBOX')).toBe('INBOX');
    });

    it('should handle malformed URLs with regex fallback', () => {
      expect(extractNodeId('some text nodeid=d1RDBb0x1IdR_CAPTURE_INBOX more text'))
        .toBe('d1RDBb0x1IdR_CAPTURE_INBOX');
    });

    it('should return null for invalid inputs', () => {
      expect(extractNodeId('')).toBe(null);
      expect(extractNodeId('https://app.tana.inc')).toBe(null); // no nodeid param
      expect(extractNodeId('https://app.tana.inc?nodeid=invalid-format-')).toBe(null);
      expect(extractNodeId('not-a-valid-node-id')).toBe(null); // readable text, not ID-like
      expect(extractNodeId('short')).toBe(null); // too short
      expect(extractNodeId(null as any)).toBe(null);
      expect(extractNodeId(undefined as any)).toBe(null);
    });
  });

  describe('validateTargetNodeId', () => {
    it('should return success for valid URLs', () => {
      const result = validateTargetNodeId('https://app.tana.inc?nodeid=d1RDBb0x1IdR_CAPTURE_INBOX');
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe('d1RDBb0x1IdR_CAPTURE_INBOX');
      expect(result.error).toBeUndefined();
    });

    it('should return success for valid node IDs', () => {
      const result = validateTargetNodeId('d1RDBb0x1IdR_CAPTURE_INBOX');
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe('d1RDBb0x1IdR_CAPTURE_INBOX');
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid inputs', () => {
      const result = validateTargetNodeId('not-a-valid-node-id');
      expect(result.success).toBe(false);
      expect(result.nodeId).toBeUndefined();
      expect(result.error).toBe('Invalid node ID format. Please provide a valid Tana node ID or URL');
    });

    it('should return error for empty inputs', () => {
      const result = validateTargetNodeId('');
      expect(result.success).toBe(false);
      expect(result.nodeId).toBeUndefined();
      expect(result.error).toBe('Target Node ID is required');
    });

    it('should handle the @ prefix case from user example', () => {
      const result = validateTargetNodeId('@https://app.tana.inc?nodeid=d1RDBb0x1IdR_CAPTURE_INBOX');
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe('d1RDBb0x1IdR_CAPTURE_INBOX');
    });
  });
}); 