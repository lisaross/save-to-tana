const { JSDOM } = require('jsdom');

// Test the actual extraction
const html1 = `
  <body>
    <h1>Test Header</h1>
    <p>This is a <a href='https://example.com'>link</a> in a paragraph.</p>
    <ul>
      <li>First item</li>
      <li>Second item</li>
    </ul>
  </body>
`;

const dom1 = new JSDOM(html1);
const doc1 = dom1.window.document;

// Test the sanitizeText function
function sanitizeText(text) {
  if (!text) return '';
  
  return text
    .replace(/\r?\n|\r/g, ' ')  // Replace newlines with spaces
    .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
    .trim();
}

// Test sanitizeNodeName function
function sanitizeNodeName(name, maxLength = 500) {
  const sanitized = sanitizeText(name);
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  
  // Truncate at word boundary if possible
  const truncated = sanitized.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) { // Only use word boundary if it's not too short
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

// Test the getFormattedText function
function getFormattedText(node) {
  if (node.nodeType === 3) { // TEXT_NODE
    return node.textContent || '';
  }
  if (node.nodeType !== 1) { // Not ELEMENT_NODE
    return '';
  }
  switch (node.tagName) {
    case 'A': {
      const href = node.href;
      const text = Array.from(node.childNodes).map(getFormattedText).join('');
      return `[${text}](${href})`;
    }
    case 'STRONG':
    case 'B': {
      const text = Array.from(node.childNodes).map(getFormattedText).join('');
      return `**${text}**`;
    }
    case 'EM':
    case 'I': {
      const text = Array.from(node.childNodes).map(getFormattedText).join('');
      return `*${text}*`;
    }
    default: {
      return Array.from(node.childNodes).map(getFormattedText).join('');
    }
  }
}

// Test extractSectionContent
function extractSectionContent(section) {
  const sectionClone = section.cloneNode(true);
  
  let text = '';
  for (const child of Array.from(sectionClone.childNodes)) {
    if (child.nodeType === 3) { // TEXT_NODE
      text += child.textContent || '';
    } else if (child.nodeType === 1) { // ELEMENT_NODE
      text += getFormattedText(child);
    }
  }
  
  return sanitizeText(text);
}

// Test with the paragraph element
const pElement = doc1.querySelector('p');
console.log('=== Testing paragraph extraction ===');
console.log('Original HTML:', pElement.outerHTML);
const extractedContent = extractSectionContent(pElement);
console.log('Extracted content:', extractedContent);
console.log('Content length:', extractedContent.length);

// Test sanitizeNodeName with different lengths
console.log('\n=== Testing sanitizeNodeName ===');
console.log('With default max (500):', sanitizeNodeName(extractedContent));
console.log('With short max (30):', sanitizeNodeName(extractedContent, 30));
console.log('With very short max (20):', sanitizeNodeName(extractedContent, 20));

// Test splitContentIntoChunks
function splitContentIntoChunks(content, maxLength = 1500) {
  if (content.length <= maxLength) {
    return [content];
  }
  
  const chunks = [];
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    if ((currentChunk + ' ' + trimmedSentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If single sentence is too long, split it
      if (trimmedSentence.length > maxLength) {
        for (let i = 0; i < trimmedSentence.length; i += maxLength) {
          const chunk = trimmedSentence.slice(i, i + maxLength);
          chunks.push(chunk + (i + maxLength < trimmedSentence.length ? '...' : ''));
        }
      } else {
        currentChunk = trimmedSentence;
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content.substring(0, maxLength) + '...'];
}

const testContent = extractSectionContent(pElement);
console.log('\n=== Testing content chunking ===');
console.log('Content to chunk:', testContent);
console.log('Chunks:', splitContentIntoChunks(testContent)); 