import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { extractContentForTana } from '../../src/utils/extractContentForTana.ts';
import { buildTanaPayload } from '../../src/tanaPayloadBuilder.ts';
import { tanaConfig } from '../../src/utils/tanaConfig.ts';

async function main() {
  try {
    // Load sample HTML
    const html = readFileSync(join(__dirname, 'sample-article.html'), 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract content
    const nodes = extractContentForTana(doc);
    if (!nodes.length) throw new Error('No nodes extracted');

    // Build payload
    const payload = buildTanaPayload(
      {
        url: 'https://example.com/sample-article',
        title: 'Sample Article for Extraction',
        author: 'Test Author',
        description: 'A sample article for Tana extraction testing.',
        content: '', // Not used, as nodes are provided
      },
      tanaConfig.targetNodeId,
      tanaConfig.supertagId,
      {
        URL: tanaConfig.fieldIdUrl,
        Author: tanaConfig.fieldIdAuthor,
        Description: tanaConfig.fieldIdDescription,
        Content: tanaConfig.fieldIdContent,
      }
    );
    // Instead of overwriting payload.nodes, add extracted content as children of the main node
    if (payload.nodes.length > 0 && nodes.length > 0) {
      // Filter out flat text nodes - only include nodes that have children (hierarchical structure)
      const hierarchicalNodes = nodes[0].children.filter(node => 
        node.children && Array.isArray(node.children) && node.children.length > 0
      );
      payload.nodes[0].children.push(...hierarchicalNodes);
    }

    // Log the payload before sending
    console.log('Payload to be sent to Tana:', JSON.stringify(payload, null, 2));

    // Send to Tana API
    const response = await fetch('https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tanaConfig.apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    console.log('Tana API response:', result);
  } catch (err) {
    console.error('Error sending to Tana:', err);
    process.exit(1);
  }
}

main(); 