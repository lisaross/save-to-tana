import { TanaPayload, TanaNode, TanaNodeChild, TanaNodeChildContent } from '../types/index';

/**
 * Configuration for payload chunking
 */
interface ChunkConfig {
  maxPayloadSize: number;  // Maximum JSON string size (Tana limit: 5000 chars)
  maxNodesPerChunk: number; // Maximum nodes per chunk (Tana limit: 100 nodes)
  maxChildrenPerNode: number; // Maximum children per node to prevent deep nesting issues
}

/**
 * Default chunking configuration based on Tana API limits
 */
const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  maxPayloadSize: 4500, // Leave some buffer under the 5000 char limit
  maxNodesPerChunk: 90,  // Leave some buffer under the 100 node limit  
  maxChildrenPerNode: 50 // Reasonable limit to prevent overly deep structures
};

/**
 * Calculate the approximate size of a JSON payload in characters
 */
function calculatePayloadSize(payload: TanaPayload): number {
  return JSON.stringify(payload).length;
}

/**
 * Count total nodes in a payload (including nested children)
 */
function countNodesInPayload(payload: TanaPayload): number {
  function countNodesRecursive(node: TanaNode | TanaNodeChild | TanaNodeChildContent): number {
    let count = 1; // Count the node itself
    
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        count += countNodesRecursive(child);
      }
    }
    
    return count;
  }
  
  return payload.nodes.reduce((total, node) => total + countNodesRecursive(node), 0);
}

/**
 * Split hierarchical content into smaller chunks while preserving structure
 */
function chunkHierarchicalContent(
  content: (TanaNodeChild | TanaNodeChildContent)[],
  config: ChunkConfig
): (TanaNodeChild | TanaNodeChildContent)[][] {
  const chunks: (TanaNodeChild | TanaNodeChildContent)[][] = [];
  let currentChunk: (TanaNodeChild | TanaNodeChildContent)[] = [];
  
  for (const item of content) {
    // Create a test payload to see if adding this item would exceed size limits
    const testPayload = {
      targetNodeId: 'test',
      nodes: [{
        name: 'Test',
        supertags: [],
        children: [...currentChunk, item]
      }]
    };
    
    const testSize = JSON.stringify(testPayload).length;
    const wouldExceedSize = testSize > config.maxPayloadSize;
    const wouldExceedChildrenLimit = currentChunk.length >= config.maxChildrenPerNode;
    
    // If adding this item would exceed limits, start a new chunk
    if ((wouldExceedSize || wouldExceedChildrenLimit) && currentChunk.length > 0) {
      chunks.push([...currentChunk]);
      currentChunk = [];
    }
    
    // If item has children and is itself too large, split its children
    if ('children' in item && Array.isArray(item.children) && item.children.length > 0) {
      const itemSize = JSON.stringify(item).length;
      
      if (itemSize > config.maxPayloadSize * 0.8) { // Use 80% of limit for individual items
        const childChunks = chunkHierarchicalContent(item.children, config);
        
        // Create multiple items with chunked children - no part numbering for hierarchy
        for (let i = 0; i < childChunks.length; i++) {
          const chunkItem = { 
            ...item, 
            name: 'name' in item ? item.name : 'Content',
            children: childChunks[i] 
          };
          
          // Check if this chunk item would fit in current chunk
          const testChunkPayload = {
            targetNodeId: 'test',
            nodes: [{
              name: 'Test',
              supertags: [],
              children: [...currentChunk, chunkItem]
            }]
          };
          
          if (JSON.stringify(testChunkPayload).length > config.maxPayloadSize && currentChunk.length > 0) {
            chunks.push([...currentChunk]);
            currentChunk = [];
          }
          
          currentChunk.push(chunkItem);
        }
      } else {
        currentChunk.push(item);
      }
    } else {
      currentChunk.push(item);
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks.length > 0 ? chunks : [[]];
}

/**
 * Create multiple payloads from a single large payload by chunking content
 */
export function chunkTanaPayload(
  originalPayload: TanaPayload,
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG
): TanaPayload[] {
  // If payload is small enough, return as-is
  const originalSize = calculatePayloadSize(originalPayload);
  const originalNodeCount = countNodesInPayload(originalPayload);
  
  if (originalSize <= config.maxPayloadSize && originalNodeCount <= config.maxNodesPerChunk) {
    return [originalPayload];
  }
  
  const chunks: TanaPayload[] = [];
  
  for (const originalNode of originalPayload.nodes) {
    if (!originalNode.children || originalNode.children.length === 0) {
      // Node has no children, create a simple payload
      const simplePayload: TanaPayload = {
        targetNodeId: originalPayload.targetNodeId,
        nodes: [{ ...originalNode }]
      };
      
      chunks.push(simplePayload);
      continue;
    }
    
    // Separate field nodes from content nodes
    const fieldNodes: (TanaNodeChild | TanaNodeChildContent)[] = [];
    const contentNodes: (TanaNodeChild | TanaNodeChildContent)[] = [];
    
    for (const child of originalNode.children) {
      if ('type' in child && child.type === 'field') {
        fieldNodes.push(child);
      } else {
        contentNodes.push(child);
      }
    }
    
    // If there are no content nodes, create a simple payload with just fields
    if (contentNodes.length === 0) {
      const simplePayload: TanaPayload = {
        targetNodeId: originalPayload.targetNodeId,
        nodes: [{ ...originalNode, children: fieldNodes }]
      };
      
      chunks.push(simplePayload);
      continue;
    }
    
    // Chunk the content nodes
    const contentChunks = chunkHierarchicalContent(contentNodes, config);
    
    for (let i = 0; i < contentChunks.length; i++) {
      // Don't add part numbers to node names when chunking - hierarchy handles organization
      const chunkNode: TanaNode = {
        ...originalNode,
        name: originalNode.name,
        children: contentChunks[i]
      };
      
      const chunkPayload: TanaPayload = {
        targetNodeId: originalPayload.targetNodeId,
        nodes: [chunkNode]
      };
      
      // Verify chunk is within limits
      const chunkSize = calculatePayloadSize(chunkPayload);
      const chunkNodeCount = countNodesInPayload(chunkPayload);
      
      if (chunkSize > config.maxPayloadSize || chunkNodeCount > config.maxNodesPerChunk) {
        console.warn(`Chunk ${i + 1} still exceeds limits: ${chunkSize} chars, ${chunkNodeCount} nodes`);
        // TODO: Could implement more aggressive chunking here if needed
      }
      
      chunks.push(chunkPayload);
    }
  }
  
  return chunks.length > 0 ? chunks : [originalPayload];
}

/**
 * Information about the chunking result
 */
export interface ChunkingInfo {
  totalChunks: number;
  originalSize: number;
  originalNodeCount: number;
  averageChunkSize: number;
  averageChunkNodeCount: number;
  chunksExceedingLimits: number;
}

/**
 * Get information about the chunking process
 */
export function getChunkingInfo(
  originalPayload: TanaPayload,
  chunks: TanaPayload[],
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG
): ChunkingInfo {
  const originalSize = calculatePayloadSize(originalPayload);
  const originalNodeCount = countNodesInPayload(originalPayload);
  
  const chunkSizes = chunks.map(calculatePayloadSize);
  const chunkNodeCounts = chunks.map(countNodesInPayload);
  
  const averageChunkSize = chunkSizes.reduce((sum, size) => sum + size, 0) / chunks.length;
  const averageChunkNodeCount = chunkNodeCounts.reduce((sum, count) => sum + count, 0) / chunks.length;
  
  const chunksExceedingLimits = chunks.filter((chunk, i) => 
    chunkSizes[i] > config.maxPayloadSize || chunkNodeCounts[i] > config.maxNodesPerChunk
  ).length;
  
  return {
    totalChunks: chunks.length,
    originalSize,
    originalNodeCount,
    averageChunkSize: Math.round(averageChunkSize),
    averageChunkNodeCount: Math.round(averageChunkNodeCount),
    chunksExceedingLimits
  };
} 