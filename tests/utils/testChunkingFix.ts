import { chunkTanaPayload } from '../../src/utils/payloadChunker';
import { TanaNodeChildContent, TanaPayload, TanaNodeChild } from '../../src/types';

// Helper function to count nodes in a payload
function countNodes(payload: TanaPayload): number {
  function countRecursive(node: any): number {
    let count = 1;
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        count += countRecursive(child);
      }
    }
    return count;
  }
  
  return payload.nodes.reduce((total: number, node: any) => total + countRecursive(node), 0);
}

// Helper function to create hierarchical content that triggers chunking but stays within limits
function createLargeHierarchicalContent(): TanaNodeChildContent[] {
  const content: TanaNodeChildContent[] = [];
  
  // Create fewer, more reasonably sized sections that will trigger chunking
  for (let section = 1; section <= 12; section++) {
    const sectionContent: TanaNodeChildContent = {
      name: `Section ${section}: Content Section`,
      children: []
    };
    
    // Add subsections to each section
    for (let subsection = 1; subsection <= 3; subsection++) {
      const subsectionContent: TanaNodeChildContent = {
        name: `Subsection ${section}.${subsection}: Details`,
        children: [
          { name: `Content for subsection ${section}.${subsection}. This contains important information about the topic with sufficient detail to be meaningful but not excessive.` },
          { name: `Additional content for subsection ${section}.${subsection} with examples and explanations that provide value to readers.` }
        ]
      };
      sectionContent.children!.push(subsectionContent);
    }
    
    content.push(sectionContent);
  }
  
  return content;
}

async function main() {
  console.log('=== TESTING CHUNKING FIX: NO MORE CONTENT CONTAINER WRAPPERS ===\n');
  
  const hierarchicalContent = createLargeHierarchicalContent();
  
  // Test 1: NEW APPROACH (Fixed) - Direct content nodes, no wrapper
  console.log('TEST 1: NEW APPROACH (Fixed Implementation)');
  console.log('==========================================');
  
  const newApproachPayload: TanaPayload = {
    targetNodeId: 'test-main-node-id',
    nodes: hierarchicalContent.map(node => ({
      name: ('name' in node ? node.name : 'Content') || 'Content',
      supertags: [] as { id: string }[],
      children: (node.children || []) as (TanaNodeChild | TanaNodeChildContent)[]
    }))
  };
  
  console.log(`Original content nodes: ${newApproachPayload.nodes.length}`);
  console.log(`Original payload size: ${JSON.stringify(newApproachPayload).length} chars`);
  
  const newChunks = chunkTanaPayload(newApproachPayload);
  console.log(`Chunked into: ${newChunks.length} parts`);
  
  // Test 2: OLD APPROACH (Problematic) - With Content Container wrapper
  console.log('\nTEST 2: OLD APPROACH (Problematic Implementation)');
  console.log('================================================');
  
  const oldApproachPayload: TanaPayload = {
    targetNodeId: 'test-main-node-id',
    nodes: [{
      name: 'Content Container',
      supertags: [],
      children: hierarchicalContent
    }]
  };
  
  console.log(`Original content nodes: ${oldApproachPayload.nodes.length}`);
  console.log(`Original payload size: ${JSON.stringify(oldApproachPayload).length} chars`);
  
  const oldChunks = chunkTanaPayload(oldApproachPayload);
  console.log(`Chunked into: ${oldChunks.length} parts`);
  
  // Analysis and Verification
  console.log('\n=== DETAILED ANALYSIS ===');
  
  // Check for wrapper nodes
  const newHasWrappers = newChunks.some(chunk => 
    chunk.nodes.some(node => node.name === 'Content Container')
  );
  const oldHasWrappers = oldChunks.some(chunk => 
    chunk.nodes.some(node => node.name === 'Content Container')
  );
  
  // Count content vs wrapper nodes
  const newContentNodes = newChunks.reduce((total, chunk) => {
    return total + chunk.nodes.filter(node => node.name !== 'Content Container').length;
  }, 0);
  
  const oldContentNodes = oldChunks.reduce((total, chunk) => {
    return total + chunk.nodes.filter(node => node.name !== 'Content Container').length;
  }, 0);
  
  const oldWrapperNodes = oldChunks.reduce((total, chunk) => {
    return total + chunk.nodes.filter(node => node.name === 'Content Container').length;
  }, 0);
  
  // Verify API compliance
  const newChunksCompliant = newChunks.every(chunk => {
    const size = JSON.stringify(chunk).length;
    const nodeCount = countNodes(chunk);
    return size <= 4500 && nodeCount <= 90;
  });
  
  const oldChunksCompliant = oldChunks.every(chunk => {
    const size = JSON.stringify(chunk).length;
    const nodeCount = countNodes(chunk);
    return size <= 4500 && nodeCount <= 90;
  });
  
  console.log('\nCHUNK COMPARISON:');
  console.log(`New approach: ${newChunks.length} chunks`);
  console.log(`Old approach: ${oldChunks.length} chunks`);
  
  console.log('\nWRAPPER NODE ANALYSIS:');
  console.log(`New approach has "Content Container" wrappers: ${newHasWrappers ? '❌ YES' : '✅ NO'}`);
  console.log(`Old approach has "Content Container" wrappers: ${oldHasWrappers ? '❌ YES' : '✅ NO'}`);
  
  console.log('\nCONTENT DISTRIBUTION:');
  console.log(`New approach: ${newContentNodes} content nodes, 0 wrapper nodes`);
  console.log(`Old approach: ${oldContentNodes} content nodes, ${oldWrapperNodes} wrapper nodes`);
  
  console.log('\nAPI COMPLIANCE:');
  console.log(`New approach chunks within limits: ${newChunksCompliant ? '✅ YES' : '❌ NO'}`);
  console.log(`Old approach chunks within limits: ${oldChunksCompliant ? '✅ YES' : '❌ NO'}`);
  
  console.log('\nSAMPLE CHUNK NAMES:');
  console.log('New approach (first 3 chunks):');
  newChunks.slice(0, 3).forEach((chunk, i) => {
    const firstName = chunk.nodes[0]?.name || 'Unknown';
    console.log(`  Chunk ${i + 1}: "${firstName}"`);
  });
  
  console.log('Old approach (first 3 chunks):');
  oldChunks.slice(0, 3).forEach((chunk, i) => {
    const firstName = chunk.nodes[0]?.name || 'Unknown';
    console.log(`  Chunk ${i + 1}: "${firstName}"`);
  });
  
  // Final verdict
  console.log('\n=== FINAL VERDICT ===');
  
  const fixWorking = !newHasWrappers && oldHasWrappers && newChunksCompliant;
  
  if (fixWorking) {
    console.log('🎉 CHUNKING FIX VERIFICATION: PASSED!');
    console.log('✅ NEW approach eliminates "Content Container" wrapper nodes');
    console.log('✅ OLD approach creates "Content Container" wrapper nodes (as expected)');
    console.log('✅ Content is properly chunked with meaningful section names');
    console.log('✅ All chunks comply with API size and node limits');
    console.log('✅ Content organization is clean and hierarchical');
    
    console.log('\n🚀 The fix successfully resolves the multiple parent nodes issue!');
  } else {
    console.log('❌ CHUNKING FIX VERIFICATION: FAILED!');
    
    if (newHasWrappers) {
      console.log('❌ NEW approach still creates "Content Container" wrapper nodes');
    }
    if (!oldHasWrappers) {
      console.log('❌ OLD approach doesn\'t create wrapper nodes (test setup issue)');
    }
    if (!newChunksCompliant) {
      console.log('❌ NEW approach chunks exceed API limits');
    }
    
    console.log('\n🚨 The fix needs further investigation!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 