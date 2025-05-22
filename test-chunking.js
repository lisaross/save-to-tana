import 'dotenv/config';
import fetch from 'node-fetch';

// Types
interface TanaNode {
  name?: string;
  description?: string;
  children?: TanaNode[];
  supertags?: Array<{ id: string }>;
  type?: string;
  attributeId?: string;
  dataType?: string;
}

interface ApiResponse {
  nodeId?: string;
  error?: string;
  children?: Array<{ nodeId: string; name: string; type: string }>;
}

// Configuration
const API_KEY = process.env.TANA_API_KEY;
const TARGET_NODE_ID = process.env.TARGET_NODE_ID || 'INBOX';
const SUPERTAG_NODE_ID = process.env.SUPERTAG_NODE_ID;
const API_URL = 'https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2';
const FIELD_URL_ID = process.env.FIELD_URL_ID;
const FIELD_AUTHOR_ID = process.env.FIELD_AUTHOR_ID;
const FIELD_DESCRIPTION_ID = process.env.FIELD_DESCRIPTION_ID;
const FIELD_CONTENT_ID = process.env.FIELD_CONTENT_ID;

// Test content - a long article or page content
const TEST_CONTENT = `
# Test Article Title

## Introduction
This is a test article that will be split into multiple chunks and saved to Tana.
${Array(20).fill('This is a paragraph of test content that will help us validate our chunking strategy. ').join('\n\n')}

## Section 1
${Array(20).fill('More test content with different lengths to ensure our chunking strategy works well. ').join('\n\n')}

## Section 2
${Array(20).fill('Final section of test content to verify chunk handling and API integration. ').join('\n\n')}
`;

// Chunking logic
function splitIntoChunks(content: string, maxSize: number): string[] {
  const paragraphs = content.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      if (paragraph.length > maxSize) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        for (const sentence of sentences) {
          if (sentence.length > maxSize) {
            for (let i = 0; i < sentence.length; i += maxSize) {
              chunks.push(sentence.slice(i, i + maxSize));
            }
          } else {
            if ((currentChunk + sentence).length > maxSize) {
              chunks.push(currentChunk);
              currentChunk = sentence;
            } else {
              currentChunk += sentence;
            }
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// API interaction
async function saveToTana(node: TanaNode, parentNodeId?: string): Promise<ApiResponse> {
  try {
    const payload: any = {
      targetNodeId: parentNodeId || TARGET_NODE_ID,
      nodes: [node],
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      console.error('Status:', response.status, response.statusText);
      // Print all headers
      if (response.headers && typeof response.headers.raw === 'function') {
        console.error('Headers:', JSON.stringify(response.headers.raw()));
      } else {
        console.error('Headers:', JSON.stringify(response.headers));
      }
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (jsonErr) {
      console.error('Failed to parse JSON response:', jsonErr);
      return { error: 'Invalid JSON response from API' };
    }
    return data;
  } catch (error) {
    console.error('Error saving to Tana:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: String(error) };
  }
}

// Minimal payload test
async function testMinimalPayload() {
  console.log('Testing minimal payload...');
  const minimalNode: TanaNode = {
    name: 'Minimal Test Node'
  };
  const payload: any = {
    targetNodeId: TARGET_NODE_ID,
    nodes: [minimalNode],
  };
  console.log('Sending minimal payload:', JSON.stringify(payload, null, 2));
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const raw = await response.text();
    console.log('Raw response:', raw);
    if (!response.ok) {
      console.error('API error response:', raw);
      console.error('Status:', response.status, response.statusText);
      if (response.headers && typeof response.headers.raw === 'function') {
        console.error('Headers:', JSON.stringify(response.headers.raw()));
      } else {
        console.error('Headers:', JSON.stringify(response.headers));
      }
      return;
    }
    try {
      const data = JSON.parse(raw);
      console.log('Parsed response:', data);
    } catch (jsonErr) {
      console.error('Failed to parse JSON response:', jsonErr);
    }
  } catch (error) {
    console.error('Error sending minimal payload:', error);
  }
}

// Main test function
async function testChunking() {
  console.log('Starting chunking test...');

  // 1. Create initial node
  // Prepare chunked content nodes for the Content field
  const chunks = splitIntoChunks(TEST_CONTENT, 4000).map((chunk, index) => ({
    name: chunk.replace(/[\r\n]+/g, ' ')
  }));

  const initialNode: TanaNode = {
    name: 'Test Article Title',
    ...(SUPERTAG_NODE_ID ? { supertags: [{ id: SUPERTAG_NODE_ID }] } : {}),
    children: [
      // URL field
      ...(FIELD_URL_ID ? [{
        type: 'field',
        attributeId: FIELD_URL_ID,
        children: [
          { dataType: 'url', name: 'https://example.com/test-article' }
        ]
      }] : []),
      // Author field
      ...(FIELD_AUTHOR_ID ? [{
        type: 'field',
        attributeId: FIELD_AUTHOR_ID,
        children: [
          { name: 'Test Author' }
        ]
      }] : []),
      // Description field
      ...(FIELD_DESCRIPTION_ID ? [{
        type: 'field',
        attributeId: FIELD_DESCRIPTION_ID,
        children: [
          { name: 'Test article for chunking strategy validation' }
        ]
      }] : []),
      // Content field (with chunked content)
      ...(FIELD_CONTENT_ID ? [{
        type: 'field',
        attributeId: FIELD_CONTENT_ID,
        children: chunks
      }] : []),
    ]
  };

  // 2. Save initial node
  console.log('Saving initial node...');
  const initialSave = await saveToTana(initialNode);
  
  // Extract nodeId from top-level or from children array
  const nodeId = initialSave.nodeId || (initialSave.children && initialSave.children[0] && initialSave.children[0].nodeId);
  if (initialSave.error || !nodeId) {
    console.error('Failed to save initial node:', initialSave.error);
    return;
  }
  console.log('Initial node saved with ID:', nodeId);
  console.log('All content uploaded as children of the Content field node.');
  console.log('Chunking test complete!');
}

// Run the test
if (!API_KEY) {
  console.error('Please set TANA_API_KEY environment variable');
} else {
  testMinimalPayload()
    .then(async () => {
      // Wait 1.1 seconds to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1100));
      await testChunking();
    })
    .catch(console.error);
} 