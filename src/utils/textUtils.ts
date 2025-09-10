/**
 * Utility functions for text processing
 */

/**
 * Sanitizes text for Tana API by removing newlines and extra spaces
 * @param text - The text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string | undefined): string {
  if (!text) return '';

  return text
    .replace(/\r?\n|\r/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim();
}

/**
 * Splits content into chunks of specified maximum size
 * @param content - The content to split
 * @param maxSize - Maximum size of each chunk
 * @returns Array of content chunks
 */
export function splitIntoChunks(content: string, maxSize: number): string[] {
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
