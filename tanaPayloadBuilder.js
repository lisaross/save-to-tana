// tanaPayloadBuilder.js

/**
 * Build a Tana API payload using the extracted schema and content data.
 * @param {object} data - The content data (url, title, author, description, content)
 * @param {string} targetNodeId - The Tana node to save under
 * @param {string} supertagId - The supertag ID for the node
 * @param {object} fieldIds - Mapping of field names to attribute IDs (e.g., { URL: '...', Author: '...', ... })
 * @returns {object} Tana API payload
 */
export function buildTanaPayload(data, targetNodeId, supertagId, fieldIds) {
  // Helper to chunk content
  function splitIntoChunks(content, maxSize) {
    const paragraphs = content.split(/\n\n+/);
    const chunks = [];
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

  // Sanitize text for Tana API
  function sanitizeText(text) {
    if (!text) return '';
    return text.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Build the main node
  const mainNode = {
    name: sanitizeText(data.title || data.url),
    supertags: [ { id: supertagId } ],
    children: []
  };

  // Add URL field
  if (data.url && fieldIds.URL) {
    mainNode.children.push({
      type: 'field',
      attributeId: fieldIds.URL,
      children: [ { dataType: 'url', name: data.url } ]
    });
  }
  // Add Author field
  if (data.author && fieldIds.Author) {
    mainNode.children.push({
      type: 'field',
      attributeId: fieldIds.Author,
      children: [ { name: sanitizeText(data.author) } ]
    });
  }
  // Add Description field
  if (data.description && fieldIds.Description) {
    mainNode.children.push({
      type: 'field',
      attributeId: fieldIds.Description,
      children: [ { name: sanitizeText(data.description) } ]
    });
  }
  // Add Content field (chunked if needed)
  if (data.content && fieldIds.Content) {
    const sanitizedContent = sanitizeText(data.content);
    const maxContentLength = 4000;
    let contentChunks = [];
    if (sanitizedContent.length > maxContentLength) {
      contentChunks = splitIntoChunks(sanitizedContent, maxContentLength).map(chunk => ({ name: chunk }));
    } else {
      contentChunks = [ { name: sanitizedContent } ];
    }
    mainNode.children.push({
      type: 'field',
      attributeId: fieldIds.Content,
      children: contentChunks
    });
  }

  return {
    targetNodeId,
    nodes: [mainNode]
  };
} 