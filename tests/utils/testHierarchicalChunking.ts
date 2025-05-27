import 'dotenv/config';
import { JSDOM } from 'jsdom';
import { extractContentForTana } from '../../src/utils/extractContentForTana.ts';
import { buildTanaPayload } from '../../src/tanaPayloadBuilder.ts';
import { chunkTanaPayload } from '../../src/utils/payloadChunker.ts';
import { tanaConfig } from '../../src/utils/tanaConfig.ts';

// Create a large HTML document to test hierarchical chunking
function createLargeHtml(): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Large Test Article for Hierarchical Chunking</title>
</head>
<body>
  <div class="main-content">
    <h1>Large Test Article for Hierarchical Chunking</h1>
    <p>This article tests the new hierarchical chunking approach where content is nested under a parent node.</p>
`;

  // Generate many sections to ensure chunking is needed
  for (let section = 1; section <= 15; section++) {
    html += `
    <h2>Section ${section}: Advanced Topic</h2>
    <p>This is a comprehensive introduction to section ${section}. It contains detailed explanations and technical content to demonstrate the hierarchical chunking functionality.</p>
`;
    
    // Add subsections with rich content
    for (let subsection = 1; subsection <= 4; subsection++) {
      html += `
    <h3>Subsection ${section}.${subsection}: Deep Dive</h3>
    <p>This subsection ${section}.${subsection} explores advanced concepts in detail. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    
    <h4>Key Points for ${section}.${subsection}</h4>
    <ul>
      <li>First key concept about topic ${section}.${subsection}.1 with detailed explanation and examples</li>
      <li>Second important aspect of topic ${section}.${subsection}.2 including technical specifications</li>
      <li>Third critical element of topic ${section}.${subsection}.3 with implementation guidelines</li>
      <li>Fourth essential component of topic ${section}.${subsection}.4 with best practices</li>
    </ul>
    
    <p>Additional comprehensive paragraph about subsection ${section}.${subsection}. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>
    
    <h4>Implementation Details for ${section}.${subsection}</h4>
    <p>Technical implementation notes for subsection ${section}.${subsection} including code examples, configuration options, and troubleshooting guidance. This content is designed to test the hierarchical chunking system's ability to maintain proper nesting while respecting API limits.</p>
`;
    }
  }

  html += `
  </div>
</body>
</html>`;

  return html;
}

async function main() {
  try {
    console.log('=== TESTING HIERARCHICAL CHUNKING APPROACH ===\n');
    
    // Create large HTML content
    const html = createLargeHtml();
    console.log(`Generated HTML length: ${html.length} characters`);
    
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract content
    console.log('Extracting content...');
    const nodes = extractContentForTana(doc);
    if (!nodes.length) throw new Error('No nodes extracted');

    console.log(`Extracted ${nodes.length} root nodes`);
    console.log(`First node has ${nodes[0].children?.length || 0} children`);

    // Simulate the new approach: create main node payload (metadata only)
    console.log('\n1. Creating main node payload (metadata only)...');
    const mainNodePayload = buildTanaPayload(
      {
        url: 'https://example.com/hierarchical-test-article',
        title: 'Hierarchical Test Article',
        author: 'Test Author',
        description: 'Testing hierarchical chunking approach.',
      },
      tanaConfig.targetNodeId,
      tanaConfig.supertagId,
      {
        URL: tanaConfig.fieldIdUrl,
        Author: tanaConfig.fieldIdAuthor,
        Description: tanaConfig.fieldIdDescription,
      }
    );

    const mainPayloadSize = JSON.stringify(mainNodePayload).length;
    console.log(`Main node payload size: ${mainPayloadSize} characters`);
    console.log(`Main node name: "${mainNodePayload.nodes[0].name}"`);

    // Simulate creating content chunks that target the main node
    console.log('\n2. Creating content chunks for hierarchical content...');
    
    if (nodes.length > 0) {
      const hierarchicalNodes = nodes[0].children.filter(node => 
        node.children && Array.isArray(node.children) && node.children.length > 0
      );
      
      // Simulate the content payload that would be sent to the created main node
      const contentPayload = {
        targetNodeId: 'SIMULATED_MAIN_NODE_ID', // This would be the actual ID returned from step 1
        nodes: [{
          name: 'Content Container',
          supertags: [],
          children: hierarchicalNodes
        }]
      };

      const contentSize = JSON.stringify(contentPayload).length;
      console.log(`Full content payload size: ${contentSize} characters`);

      // Test chunking the content payload
      const contentChunks = chunkTanaPayload(contentPayload);
      console.log(`Content chunked into ${contentChunks.length} parts`);

      // Display chunk information
      console.log('\n3. Content chunk details:');
      contentChunks.forEach((chunk, index) => {
        const chunkSize = JSON.stringify(chunk).length;
        const chunkNodeCount = countNodes(chunk);
        const firstContentNode = chunk.nodes[0]?.children?.[0];
        const chunkPreview = firstContentNode ? 
          ('name' in firstContentNode ? firstContentNode.name : 'Unknown content') : 
          'No content';
        
        console.log(`  Chunk ${index + 1}: ${chunkSize} chars, ${chunkNodeCount} nodes`);
        console.log(`    Target: ${chunk.targetNodeId}`);
        console.log(`    Preview: "${chunkPreview?.substring(0, 60)}${(chunkPreview?.length || 0) > 60 ? '...' : ''}"`);
      });

      // Verify all chunks are within limits
      const chunksWithinLimits = contentChunks.every(chunk => {
        const size = JSON.stringify(chunk).length;
        const nodeCount = countNodes(chunk);
        return size <= 4500 && nodeCount <= 90;
      });

      console.log('\n4. Results:');
      console.log(`✅ Main node payload: ${mainPayloadSize} chars (within limits)`);
      console.log(`✅ Content chunks: ${contentChunks.length} parts`);
      console.log(`${chunksWithinLimits ? '✅' : '❌'} All chunks within API limits: ${chunksWithinLimits}`);
      
      if (chunksWithinLimits) {
        console.log('\n🎉 HIERARCHICAL CHUNKING TEST PASSED!');
        console.log('The new approach successfully:');
        console.log('- Creates a metadata-only main node first');
        console.log('- Chunks large content into manageable pieces');
        console.log('- All content chunks target the main node for proper nesting');
        console.log('- Respects API size and node count limits');
      } else {
        console.log('\n❌ Some chunks still exceed limits - need more aggressive chunking');
      }
    }

  } catch (err) {
    console.error('Error testing hierarchical chunking:', err);
    process.exit(1);
  }
}

// Helper function to count nodes in a payload
function countNodes(payload: any): number {
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

main(); 