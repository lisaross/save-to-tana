/**
 * Utility functions for validating and extracting Tana node IDs
 */

/**
 * Extract node ID from a Tana URL or return the input if it's already a node ID
 * @param input - Either a full Tana URL or a node ID
 * @returns The extracted node ID or null if invalid
 */
export function extractNodeId(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmedInput = input.trim();

  // Check if it's a Tana URL
  if (trimmedInput.includes('app.tana.inc') || trimmedInput.includes('nodeid=')) {
    try {
      const url = new URL(trimmedInput);
      const nodeId = url.searchParams.get('nodeid');
      return nodeId && isValidNodeId(nodeId) ? nodeId : null;
    } catch {
      // If URL parsing fails, try regex extraction
      const match = trimmedInput.match(/nodeid=([^&\s]+)/);
      if (match && match[1]) {
        const nodeId = match[1];
        return isValidNodeId(nodeId) ? nodeId : null;
      }
      return null;
    }
  }

  // Check if it's already a valid node ID
  return isValidNodeId(trimmedInput) ? trimmedInput : null;
}

/**
 * Validate if a string is a valid Tana node ID
 * Based on Tana documentation examples: node IDs are typically alphanumeric with dashes/underscores
 * Examples: z-p8LdQk6I76, d1RDBb0x1IdR_CAPTURE_INBOX, MaaJRCypzJ
 * @param nodeId - The node ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidNodeId(nodeId: string): boolean {
  if (!nodeId || typeof nodeId !== 'string') {
    return false;
  }

  const trimmed = nodeId.trim();
  
  // Check for special node IDs
  const specialNodeIds = ['INBOX', 'SCHEMA', 'LIBRARY'];
  if (specialNodeIds.includes(trimmed)) {
    return true;
  }

  // Check for valid node ID pattern based on actual Tana examples:
  // - Length between 8-30 characters
  // - Must start with alphanumeric
  // - Can contain alphanumeric, dashes, and underscores  
  // - Must end with alphanumeric
  // - Should look like actual Tana IDs (mix of letters/numbers, may have underscores/dashes)
  const nodeIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{6,28}[a-zA-Z0-9]$/;
  
  if (!nodeIdPattern.test(trimmed)) {
    return false;
  }
  
  // Additional validation: reject common invalid patterns
  // - All lowercase words separated by dashes (likely not a node ID)
  // - Patterns that look like readable text rather than IDs
  if (/^[a-z]+(-[a-z]+)+$/.test(trimmed)) {
    return false; // Patterns like "not-a-url-or-valid-id"
  }
  
  // Must contain at least some mixed case or numbers (typical of Tana IDs)
  const hasMixedCaseOrNumbers = /[A-Z0-9]/.test(trimmed);
  
  return hasMixedCaseOrNumbers;
}

/**
 * Validate and clean a target node ID input
 * @param input - Raw input from user (URL or node ID)
 * @returns Object with success status, cleaned node ID, and error message if any
 */
export function validateTargetNodeId(input: string): {
  success: boolean;
  nodeId?: string;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return {
      success: false,
      error: 'Target Node ID is required'
    };
  }

  const extractedNodeId = extractNodeId(input);
  
  if (!extractedNodeId) {
    return {
      success: false,
      error: 'Invalid node ID format. Please provide a valid Tana node ID or URL'
    };
  }

  return {
    success: true,
    nodeId: extractedNodeId
  };
} 