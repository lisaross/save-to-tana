import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';
import { extractContentForTana } from '../../src/utils/extractContentForTana.ts';
import { buildTanaPayload } from '../../src/tanaPayloadBuilder.ts';
import { chunkTanaPayload, getChunkingInfo } from '../../src/utils/payloadChunker.ts';
import { tanaConfig } from '../../src/utils/tanaConfig.ts';

// Create a large HTML document to test chunking
function createLargeHtml(): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Large Test Article</title>
</head>
<body>
  <div class="main-content">
    <h1>Large Test Article</h1>
    <p>This is a test article with a lot of content to test payload chunking.</p>
`;

  // Generate 20 sections with multiple paragraphs each
  for (let section = 1; section <= 20; section++) {
    html += `
    <h2>Section ${section}</h2>
    <p>This is the introduction paragraph for section ${section}. It contains some text to make the payload larger.</p>
`;
    
    // Add 5 subsections per section
    for (let subsection = 1; subsection <= 5; subsection++) {
      html += `
    <h3>Subsection ${section}.${subsection}</h3>
    <p>This is subsection ${section}.${subsection} with detailed content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    <ul>
      <li>First bullet point with some detailed explanation about topic ${section}.${subsection}.1</li>
      <li>Second bullet point with even more detailed explanation about topic ${section}.${subsection}.2</li>
      <li>Third bullet point explaining the complex relationship between topics ${section}.${subsection}.3</li>
    </ul>
    <p>Additional paragraph with more content about subsection ${section}.${subsection}. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
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
    // Create large HTML content
    const html = createLargeHtml();
    console.log(`Generated HTML length: ${html.length} characters`);
    
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract content (this should not modify the original document)
    console.log('Extracting content...');
    const nodes = extractContentForTana(doc);
    if (!nodes.length) throw new Error('No nodes extracted');

    console.log(`Extracted ${nodes.length} root nodes`);
    console.log(`First node has ${nodes[0].children?.length || 0} children`);

    // Build initial payload
    console.log('Building payload...');
    const payload = buildTanaPayload(
      {
        url: 'https://example.com/large-test-article',
        title: 'Large Test Article',
        author: 'Test Author',
        description: 'A large test article for chunking functionality.',
      },
      tanaConfig.targetNodeId,
      tanaConfig.supertagId,
      {
        URL: tanaConfig.fieldIdUrl,
        Author: tanaConfig.fieldIdAuthor,
        Description: tanaConfig.fieldIdDescription,
      }
    );

    // Add extracted content
    if (payload.nodes.length > 0 && nodes.length > 0) {
      const hierarchicalNodes = nodes[0].children.filter(node => 
        node.children && Array.isArray(node.children) && node.children.length > 0
      );
      payload.nodes[0].children.push(...hierarchicalNodes);
    }

    // Check original payload size
    const originalSize = JSON.stringify(payload).length;
    console.log(`Original payload size: ${originalSize} characters`);

    // Chunk the payload
    console.log('Chunking payload...');
    const chunks = chunkTanaPayload(payload);
    const chunkingInfo = getChunkingInfo(payload, chunks);

    // Display chunking results
    console.log('\n=== CHUNKING RESULTS ===');
    console.log(`Original size: ${chunkingInfo.originalSize} characters`);
    console.log(`Original node count: ${chunkingInfo.originalNodeCount} nodes`);
    console.log(`Total chunks created: ${chunkingInfo.totalChunks}`);
    console.log(`Average chunk size: ${chunkingInfo.averageChunkSize} characters`);
    console.log(`Average chunk node count: ${chunkingInfo.averageChunkNodeCount} nodes`);
    console.log(`Chunks exceeding limits: ${chunkingInfo.chunksExceedingLimits}`);

    // Display individual chunk information
    console.log('\n=== CHUNK DETAILS ===');
    chunks.forEach((chunk, index) => {
      const chunkSize = JSON.stringify(chunk).length;
      const chunkNodeCount = countNodes(chunk);
      console.log(`Chunk ${index + 1}: ${chunkSize} chars, ${chunkNodeCount} nodes - "${chunk.nodes[0]?.name}"`);
    });

    if (chunkingInfo.chunksExceedingLimits > 0) {
      console.warn('\nWARNING: Some chunks still exceed API limits. May need more aggressive chunking.');
    } else {
      console.log('\n✅ All chunks are within API limits!');
    }

  } catch (err) {
    console.error('Error testing chunking:', err);
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